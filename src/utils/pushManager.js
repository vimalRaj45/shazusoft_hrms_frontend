/**
 * pushManager.js
 * Frontend utility for managing Web Push Notification subscriptions.
 * Handles: Service Worker registration, permission requests,
 *          browser PushSubscription creation, and backend API sync.
 */

import api from '../services/api';

const SW_PATH = '/sw.js';
const STORAGE_KEY = 'shazu_push_subscribed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a URL-safe base64 string to a Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ─── Service Worker Registration ──────────────────────────────────────────────

/**
 * Registers the service worker and returns the registration object.
 * Returns null if the browser doesn't support SW.
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PushManager] Service Workers are not supported in this browser.');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
    await navigator.serviceWorker.ready;
    console.log('[PushManager] Service Worker registered successfully.');
    return registration;
  } catch (err) {
    console.error('[PushManager] Service Worker registration failed:', err);
    return null;
  }
}

// ─── Permission ───────────────────────────────────────────────────────────────

/**
 * Requests notification permission from the browser.
 * Returns: 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[PushManager] Notifications are not supported in this browser.');
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  const permission = await Notification.requestPermission();
  return permission;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

/**
 * Checks if the user is currently subscribed to push notifications.
 * Returns the PushSubscription object or null.
 */
export async function getCurrentSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Full subscription flow:
 * 1. Register SW
 * 2. Request permission
 * 3. Fetch VAPID public key from backend
 * 4. Create PushSubscription
 * 5. Save to backend
 * Returns: { success: boolean, subscription?: PushSubscription, error?: string }
 */
export async function subscribeToPushNotifications() {
  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'Service Worker not supported or registration failed.' };
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied by the user.' };
    }

    const { data: keyData } = await api.get('/notifications/vapid-public-key');
    const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    await api.post('/notifications/subscribe', {
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent
    });

    localStorage.setItem(STORAGE_KEY, 'true');
    console.log('[PushManager] Successfully subscribed to push notifications.');
    return { success: true, subscription };
  } catch (err) {
    console.error('[PushManager] Subscription error:', err);
    return { success: false, error: err.message || 'Failed to subscribe to push notifications.' };
  }
}

/**
 * Unsubscribes from push notifications:
 * 1. Revokes browser PushSubscription
 * 2. Notifies the backend to remove the subscription record
 * Returns: { success: boolean }
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      localStorage.removeItem(STORAGE_KEY);
      return { success: true };
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await api.post('/notifications/unsubscribe', { endpoint }).catch(() => {});

    localStorage.removeItem(STORAGE_KEY);
    console.log('[PushManager] Successfully unsubscribed from push notifications.');
    return { success: true };
  } catch (err) {
    console.error('[PushManager] Unsubscription error:', err);
    return { success: false, error: err.message || 'Failed to unsubscribe.' };
  }
}

/**
 * Sends a test push notification to the current user's devices via backend.
 */
export async function sendTestNotification() {
  try {
    const { data } = await api.post('/notifications/send-test');
    return data;
  } catch (err) {
    console.error('[PushManager] Test notification error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Checks if the user is currently considered subscribed (local flag + live browser check).
 */
export async function isSubscribed() {
  const localFlag = localStorage.getItem(STORAGE_KEY) === 'true';
  if (!localFlag) return false;
  const sub = await getCurrentSubscription();
  if (!sub) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
  return true;
}

const pushManager = {
  registerServiceWorker,
  requestNotificationPermission,
  getCurrentSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestNotification,
  isSubscribed
};

export default pushManager;
