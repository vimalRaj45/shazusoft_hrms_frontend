import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import pushManager from '../utils/pushManager';
import { muiToast } from '../utils/muiToast';

const NotificationContext = createContext(null);

// Gentle, modern web audio chime for live incoming alerts
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch (e) {
    // Autoplay restrictions handle silently
  }
}

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // 1. Fetch In-App notifications from API
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!token || !user) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await notificationsAPI.getInApp({ limit: 50 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch notifications:', err?.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, user]);

  // 2. Check browser Web Push subscription status
  const checkPushSubscription = useCallback(async () => {
    try {
      const sub = await pushManager.isSubscribed();
      setIsPushSubscribed(Boolean(sub));
    } catch {
      setIsPushSubscribed(false);
    }
  }, []);

  // 3. Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    if (!id) return;
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationsAPI.markRead(id);
    } catch (err) {
      console.error('[NotificationContext] Error marking notification as read:', err);
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // 4. Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await notificationsAPI.markAllRead();
      muiToast.success('All notifications marked as read.');
    } catch (err) {
      console.error('[NotificationContext] Error marking all as read:', err);
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // 5. Delete a notification
  const deleteNotification = useCallback(async (id) => {
    if (!id) return;
    const target = notifications.find(n => n.id === id);
    const wasUnread = target && !target.is_read;

    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationsAPI.deleteInApp(id);
    } catch (err) {
      console.error('[NotificationContext] Error deleting notification:', err);
      fetchNotifications(true);
    }
  }, [notifications, fetchNotifications]);

  // 6. Toggle Web Push Notifications
  const togglePushSubscription = useCallback(async () => {
    try {
      if (isPushSubscribed) {
        const res = await pushManager.unsubscribeFromPushNotifications();
        if (res.success) {
          setIsPushSubscribed(false);
          muiToast.info('Web push notifications disabled on this device.');
        } else {
          muiToast.error(res.error || 'Failed to unsubscribe.');
        }
      } else {
        const res = await pushManager.subscribeToPushNotifications();
        if (res.success) {
          setIsPushSubscribed(true);
          muiToast.success('Web push notifications enabled successfully!');
        } else {
          muiToast.warning(res.error || 'Push permission was denied or not granted.');
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Toggle push error:', err);
      muiToast.error('Could not toggle push notifications: ' + (err.message || 'Unknown error'));
    }
  }, [isPushSubscribed]);

  // 7. Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.sendInAppTest();
      muiToast.success(data?.message || 'Test notification sent!');
    } catch (err) {
      console.error('[NotificationContext] Test notification error:', err);
      muiToast.error('Failed to send test notification: ' + (err.response?.data?.error || err.message));
    }
  }, []);

  // 8. Connect to real-time SSE stream with auto-reconnect
  useEffect(() => {
    if (!token || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    fetchNotifications();
    checkPushSubscription();

    let retryDelay = 3000;
    let isMounted = true;

    const connectSSE = () => {
      if (!isMounted || !token) return;

      // Close previous connection if exists
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Fastify backend base URL from window location or api baseURL
      const streamUrl = `/api/notifications/stream?token=${encodeURIComponent(token)}`;

      try {
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.addEventListener('connected', () => {
          if (!isMounted) return;
          setIsConnected(true);
          retryDelay = 3000; // Reset backoff on successful handshake
        });

        es.addEventListener('notification', (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            
            // Add new notification to list (deduplicated by id if available)
            setNotifications(prev => {
              if (data.id && prev.some(n => n.id === data.id)) return prev;
              return [data, ...prev];
            });
            setUnreadCount(prev => prev + 1);

            // Play gentle audio chime
            playNotificationChime();

            // Display in-app toast
            muiToast.info(data.title ? `${data.title}: ${data.message}` : data.message);
          } catch (e) {
            console.error('[NotificationContext] Failed to parse SSE event data:', e);
          }
        });

        es.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
          es.close();

          // Exponential backoff reconnect
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 1.5, 30000);
            connectSSE();
          }, retryDelay);
        };
      } catch (err) {
        console.warn('[NotificationContext] EventSource initialization error:', err);
      }
    };

    connectSSE();

    // 45s fallback polling interval in case SSE stream is temporarily interrupted
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications(true);
      checkPushSubscription();
    }, 45000);

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollingIntervalRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [token, user?.id, fetchNotifications, checkPushSubscription]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    isPushSubscribed,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    togglePushSubscription,
    sendTestNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
