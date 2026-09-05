import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Campaign as CampaignIcon,
  SupportAgent as SupportAgentIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  WarningAmber as WarningIcon,
  AccessTime as AccessTimeIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ticketsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Attendance / Regularization',
  'Payroll / Salary',
  'Leave Clarification',
  'IT & Device Support',
  'Task / Project Help',
  'General HR & Policy'
];

const PRIORITIES = [
  { label: 'Low', color: '#64748b', bg: '#f1f5f9' },
  { label: 'Medium', color: '#d97706', bg: '#fef3c7' },
  { label: 'High', color: '#ea580c', bg: '#ffedd5' },
  { label: 'Urgent', color: '#dc2626', bg: '#fee2e2' }
];

const STATUS_CONFIG = {
  'Open': { color: '#2563eb', bg: '#dbeafe', label: 'Open' },
  'In-Progress': { color: '#d97706', bg: '#fef3c7', label: 'In-Progress' },
  'Resolved': { color: '#16a34a', bg: '#dcfce7', label: 'Resolved' },
  'Closed': { color: '#475569', bg: '#f1f5f9', label: 'Closed' }
};

export default function IssueResolutionChatHub({ user }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  // State
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  
  // Broadcasts
  const [broadcasts, setBroadcasts] = useState([]);
  const [openBroadcastDialog, setOpenBroadcastDialog] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({ title: '', content: '', priority: 'Normal' });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // New Ticket Modal
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    category: 'Attendance / Regularization',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  // Mobile navigation view: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Tickets
  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await ticketsAPI.getTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search: searchQuery
      });
      setTickets(res.data.tickets || []);
      if (res.data.metrics) setMetrics(res.data.metrics);
      
      // Auto-select first ticket if none selected on desktop
      if (!selectedTicket && res.data.tickets?.length > 0 && !isMobile) {
        setSelectedTicket(res.data.tickets[0]);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      if (!silent) toast.error('Failed to load tickets.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch Broadcasts
  const fetchBroadcasts = async () => {
    try {
      const res = await ticketsAPI.getBroadcasts();
      setBroadcasts(res.data.broadcasts || []);
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
    }
  };

  // Fetch Messages for Selected Ticket
  const fetchMessages = async (ticketId, silent = false) => {
    if (!ticketId) return;
    if (!silent) setMessagesLoading(true);
    try {
      const res = await ticketsAPI.getMessages(ticketId);
      setMessages(res.data.messages || []);
      if (res.data.ticket) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (!silent) toast.error('Failed to load messages.');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchBroadcasts();
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    if (selectedTicket?.id) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Live polling every 4 seconds while chat is active
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(true);
      if (selectedTicket?.id) {
        fetchMessages(selectedTicket.id, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedTicket?.id || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      await ticketsAPI.sendMessage(selectedTicket.id, { message: messageText });
      await fetchMessages(selectedTicket.id, true);
      fetchTickets(true);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message.');
      setInputMessage(messageText); // Restore on error
    } finally {
      setSending(false);
    }
  };

  // Handle Create Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketData.subject.trim() || !newTicketData.description.trim()) {
      toast.error('Please enter a subject and description.');
      return;
    }

    try {
      const res = await ticketsAPI.createTicket(newTicketData);
      toast.success(res.data.message || 'Ticket raised successfully!');
      setOpenNewDialog(false);
      setNewTicketData({
        category: 'Attendance / Regularization',
        subject: '',
        description: '',
        priority: 'Medium'
      });
      fetchTickets();
      if (res.data.ticket) {
        setSelectedTicket(res.data.ticket);
        if (isMobile) setMobileView('chat');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error(err.response?.data?.error || 'Failed to create ticket.');
    }
  };

  // Handle Status Change
  const handleStatusChange = async (newStatus, notes = '') => {
    if (!selectedTicket?.id) return;
    try {
      const res = await ticketsAPI.updateStatus(selectedTicket.id, {
        status: newStatus,
        resolution_notes: notes
      });
      toast.success(`Ticket marked as ${newStatus}`);
      setSelectedTicket(res.data.ticket);
      fetchMessages(selectedTicket.id, true);
      fetchTickets(true);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.response?.data?.error || 'Failed to update status.');
    }
  };

  // Handle Create Broadcast
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!newBroadcast.title.trim() || !newBroadcast.content.trim()) {
      toast.error('Please fill in title and content.');
      return;
    }

    try {
      await ticketsAPI.createBroadcast(newBroadcast);
      toast.success('Announcement broadcasted successfully!');
      setOpenBroadcastDialog(false);
      setNewBroadcast({ title: '', content: '', priority: 'Normal' });
      fetchBroadcasts();
    } catch (err) {
      console.error('Error creating broadcast:', err);
      toast.error(err.response?.data?.error || 'Failed to broadcast announcement.');
    }
  };

  const selectTicket = (ticket) => {
    setSelectedTicket(ticket);
    if (isMobile) setMobileView('chat');
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Header Banner */}
      <Box sx={{ mb: 2.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            Staff & Management Issue Resolution Hub
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Direct real-time communication for support requests, leave queries, attendance disputes & HR help
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          {isAdmin && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CampaignIcon />}
              onClick={() => setOpenBroadcastDialog(true)}
              sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600, flex: { xs: 1, sm: 'none' } }}
            >
              Broadcast Notice
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewDialog(true)}
            sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600, flex: { xs: 1, sm: 'none' } }}
          >
            + Raise New Issue
          </Button>
        </Box>
      </Box>

      {/* Broadcast Banner (if any) */}
      {broadcasts.length > 0 && (
        <Alert
          severity={broadcasts[0].priority === 'Urgent' ? 'error' : 'info'}
          icon={<CampaignIcon />}
          sx={{ mb: 2, borderRadius: '4px', border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {broadcasts[0].title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {broadcasts[0].content}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Posted by {broadcasts[0].created_by_name} • {broadcasts[0].created_at ? format(parseISO(broadcasts[0].created_at), 'MMM d, yyyy h:mm a') : 'Recent'}
          </Typography>
        </Alert>
      )}

      {/* Summary KPI Badges */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 1.2,
          mb: 2.5
        }}
      >
        {[
          { label: 'All Issues', count: metrics.total, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Open', count: metrics.open, color: '#0284c7', bg: '#e0f2fe' },
          { label: 'In-Progress', count: metrics.inProgress, color: '#d97706', bg: '#fef3c7' },
          { label: 'Resolved', count: metrics.resolved, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Closed', count: metrics.closed, color: '#475569', bg: '#f1f5f9' }
        ].map((kpi, idx) => (
          <Paper
            key={idx}
            elevation={0}
            onClick={() => setStatusFilter(kpi.label === 'All Issues' ? 'all' : kpi.label)}
            sx={{
              p: 1.2,
              borderRadius: '4px',
              border: '1px solid',
              borderColor: statusFilter === (kpi.label === 'All Issues' ? 'all' : kpi.label) ? kpi.color : 'divider',
              bgcolor: statusFilter === (kpi.label === 'All Issues' ? 'all' : kpi.label) ? kpi.bg : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              '&:hover': { borderColor: kpi.color, transform: 'translateY(-1px)' }
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em', display: 'block' }}>
              {kpi.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: kpi.color, lineHeight: 1.2, mt: 0.3 }}>
              {kpi.count}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Main Workspace: Left Sidebar + Right Chat Pane */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '4px',
          overflow: 'hidden',
          minHeight: '620px',
          height: { xs: 'auto', md: 'calc(100vh - 280px)' },
          maxHeight: { md: '820px' },
          display: 'flex',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Left Side: Ticket Feed */}
        {(!isMobile || mobileView === 'list') && (
          <Box
            sx={{
              width: { xs: '100%', md: '340px', lg: '380px' },
              minWidth: { md: '320px', lg: '360px' },
              maxWidth: { md: '400px' },
              flexShrink: 0,
              borderRight: { xs: 'none', md: '1px solid' },
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Search & Filter Bar */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Search ticket #, subject, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 0.75 }} />,
                  sx: { borderRadius: '4px', fontSize: '0.85rem' }
                }}
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    sx={{ borderRadius: '4px', fontSize: '0.75rem', height: 32 }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <Select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    sx={{ borderRadius: '4px', fontSize: '0.75rem', height: 32 }}
                  >
                    <MenuItem value="all">All Priority</MenuItem>
                    {PRIORITIES.map(p => <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Ticket List Items */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : tickets.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <SupportAgentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>No support tickets found</Typography>
                  <Typography variant="caption">Click "+ Raise New Issue" to start a thread</Typography>
                </Box>
              ) : (
                tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  const statusConf = STATUS_CONFIG[t.status] || STATUS_CONFIG['Open'];
                  const prioConf = PRIORITIES.find(p => p.label === t.priority) || PRIORITIES[1];

                  return (
                    <Box
                      key={t.id}
                      onClick={() => selectTicket(t)}
                      sx={{
                        p: 1.5,
                        px: 1.75,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        bgcolor: isSelected ? '#f0fdf4' : 'transparent',
                        borderLeft: isSelected ? '3px solid #15803d' : '3px solid transparent',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': { bgcolor: isSelected ? '#f0fdf4' : 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803d', fontSize: '0.75rem', letterSpacing: '0.02em' }}>
                          {t.ticket_number}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <Chip
                            label={t.priority}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: prioConf.bg,
                              color: prioConf.color,
                              borderRadius: '4px',
                              px: 0.25
                            }}
                          />
                          <Chip
                            label={t.status}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: statusConf.bg,
                              color: statusConf.color,
                              borderRadius: '4px',
                              px: 0.25
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: '#0f172a',
                          fontSize: '0.84rem',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {t.subject}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.74rem',
                          mt: 0.35,
                          lineHeight: 1.3
                        }}
                      >
                        {t.latest_message ? `${t.latest_message.sender_name}: ${t.latest_message.message}` : t.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.75 }}>
                        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.7rem', fontWeight: 600 }}>
                          {t.creator_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                          {t.updated_at ? format(parseISO(t.updated_at), 'MMM d, h:mm a') : ''}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        )}

        {/* Right Side: Chat Conversation Pane */}
        {(!isMobile || mobileView === 'chat') && (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#f8fafc',
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            {selectedTicket ? (
              <>
                {/* Responsive Conversation Header Bar */}
                <Box
                  sx={{
                    p: { xs: 1.25, sm: 1.5 },
                    px: { xs: 1.5, sm: 2 },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  {/* Top Row: Back button (on mobile) + Title & Number + Refresh */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, flex: 1 }}>
                      {isMobile && (
                        <IconButton size="small" onClick={() => setMobileView('list')} sx={{ p: 0.5, flexShrink: 0 }}>
                          <ArrowBackIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          color: '#0f172a',
                          fontSize: { xs: '0.85rem', sm: '0.92rem' },
                          textTransform: 'uppercase',
                          letterSpacing: '0.01em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {selectedTicket.ticket_number}: {selectedTicket.subject}
                      </Typography>
                    </Box>

                    <IconButton size="small" onClick={() => fetchMessages(selectedTicket.id)} title="Refresh Conversation" sx={{ flexShrink: 0 }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Second Row: Category & Metadata on Left, Status on Right */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, width: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      <Chip label={selectedTicket.category} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#f1f5f9' }} />
                      <span>Raised by: <strong>{selectedTicket.creator_name}</strong></span>
                      <span>•</span>
                      <span>{selectedTicket.created_at ? format(parseISO(selectedTicket.created_at), 'MMM d, h:mm a') : ''}</span>
                    </Typography>

                    {/* Status Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      {isAdmin ? (
                        <FormControl size="small" sx={{ minWidth: 125 }}>
                          <Select
                            value={selectedTicket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            sx={{
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              height: 28,
                              bgcolor: STATUS_CONFIG[selectedTicket.status]?.bg || '#f1f5f9',
                              color: STATUS_CONFIG[selectedTicket.status]?.color || '#334155'
                            }}
                          >
                            <MenuItem value="Open">Open</MenuItem>
                            <MenuItem value="In-Progress">In-Progress</MenuItem>
                            <MenuItem value="Resolved">Resolved</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleStatusChange('Resolved', 'Staff confirmed issue resolved.')}
                            sx={{ borderRadius: '4px', textTransform: 'none', fontSize: '0.72rem', fontWeight: 600, height: 28 }}
                          >
                            Mark as Resolved
                          </Button>
                        )
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Messages Feed Area */}
                <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {messagesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body2">No messages in this thread yet.</Typography>
                    </Box>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.sender_id === user?.id;
                      const isSystem = msg.sender_id === 'SYSTEM' || msg.sender_role === 'system';
                      const isSenderAdmin = msg.sender_role === 'admin' || msg.sender_role === 'manager';

                      if (isSystem) {
                        return (
                          <Box key={msg.id || index} sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                            <Chip
                              label={msg.message}
                              size="small"
                              icon={<InfoIcon style={{ fontSize: 14 }} />}
                              sx={{
                                borderRadius: '4px',
                                bgcolor: '#e2e8f0',
                                fontSize: '0.72rem',
                                color: '#334155',
                                height: 26,
                                maxWidth: '90%'
                              }}
                            />
                          </Box>
                        );
                      }

                      return (
                        <Box
                          key={msg.id || index}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '100%'
                          }}
                        >
                          {/* Sender name badge */}
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.7rem',
                              mb: 0.25,
                              px: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <span>{msg.sender_name}</span>
                            {isSenderAdmin && (
                              <Chip
                                label="Management"
                                size="small"
                                sx={{
                                  height: 14,
                                  fontSize: '0.55rem',
                                  fontWeight: 700,
                                  bgcolor: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '2px',
                                  px: 0
                                }}
                              />
                            )}
                          </Typography>

                          {/* Message Bubble */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: '4px',
                              maxWidth: { xs: '85%', sm: '75%' },
                              bgcolor: isMe ? '#133829' : '#ffffff',
                              color: isMe ? '#ffffff' : '#0f172a',
                              border: isMe ? 'none' : '1px solid #e2e8f0',
                              wordBreak: 'break-word',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: '0.84rem', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                              {msg.message}
                            </Typography>
                          </Paper>

                          {/* Timestamp */}
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', mt: 0.25, px: 0.5 }}>
                            {msg.created_at ? format(parseISO(msg.created_at), 'h:mm a') : ''}
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Quick Reply Suggestions (For Management/Admin) */}
                {isAdmin && (
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      overflowX: 'auto',
                      bgcolor: '#ffffff',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      '&::-webkit-scrollbar': { height: 4 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '2px' }
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', flexShrink: 0, mr: 0.5 }}>
                      Quick Reply:
                    </Typography>
                    {[
                      'Approved and timesheet corrected.',
                      'Please provide the date and punch time.',
                      'Leave query updated in your balance.',
                      'IT support ticket has been escalated.'
                    ].map((tpl, i) => (
                      <Chip
                        key={i}
                        label={tpl}
                        size="small"
                        onClick={() => setInputMessage(tpl)}
                        sx={{
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          flexShrink: 0,
                          bgcolor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          '&:hover': { bgcolor: '#e2e8f0' }
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Chat Input Bar */}
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 1.5,
                    px: 2,
                    bgcolor: '#ffffff',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <TextField
                    size="small"
                    placeholder="Type your message or resolution note (Press Enter to send)..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={3}
                    fullWidth
                    InputProps={{ sx: { borderRadius: '4px', fontSize: '0.85rem' } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!inputMessage.trim() || sending}
                    sx={{
                      minWidth: '42px',
                      width: '42px',
                      height: '40px',
                      borderRadius: '4px',
                      p: 0,
                      bgcolor: '#133829',
                      '&:hover': { bgcolor: '#0b2319' }
                    }}
                  >
                    {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, color: 'text.secondary' }}>
                <ChatIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Select a Support Thread</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, textAlign: 'center', maxWidth: 400 }}>
                  Choose a ticket from the left panel to read the conversation and chat directly with staff / management.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* MODAL: Raise New Support Ticket */}
      <Dialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Raise New Support Issue / Query
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Issue Category</InputLabel>
              <Select
                value={newTicketData.category}
                label="Issue Category"
                onChange={(e) => setNewTicketData({ ...newTicketData, category: e.target.value })}
                sx={{ borderRadius: '4px' }}
              >
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={newTicketData.priority}
                label="Priority Level"
                onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                sx={{ borderRadius: '4px' }}
              >
                {PRIORITIES.map(p => <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Subject / Short Summary"
              size="small"
              placeholder="e.g. Punch-in time correction for yesterday"
              value={newTicketData.subject}
              onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
              fullWidth
              InputProps={{ sx: { borderRadius: '4px' } }}
            />

            <TextField
              label="Detailed Explanation"
              size="small"
              placeholder="Explain what happened or what assistance is needed..."
              multiline
              rows={4}
              value={newTicketData.description}
              onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
              fullWidth
              InputProps={{ sx: { borderRadius: '4px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenNewDialog(false)} sx={{ borderRadius: '4px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTicket}
            sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600 }}
          >
            Submit Issue
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Admin Broadcast Announcement */}
      <Dialog
        open={openBroadcastDialog}
        onClose={() => setOpenBroadcastDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon color="primary" /> Broadcast Company Notice
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={newBroadcast.priority}
                label="Priority"
                onChange={(e) => setNewBroadcast({ ...newBroadcast, priority: e.target.value })}
                sx={{ borderRadius: '4px' }}
              >
                <MenuItem value="Normal">Normal Announcement</MenuItem>
                <MenuItem value="Important">Important</MenuItem>
                <MenuItem value="Urgent">Urgent / Action Required</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Announcement Title"
              size="small"
              placeholder="e.g. Upcoming Festival Holiday Schedule"
              value={newBroadcast.title}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
              fullWidth
              InputProps={{ sx: { borderRadius: '4px' } }}
            />

            <TextField
              label="Announcement Content"
              size="small"
              placeholder="Write the full message to all staff..."
              multiline
              rows={4}
              value={newBroadcast.content}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, content: e.target.value })}
              fullWidth
              InputProps={{ sx: { borderRadius: '4px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBroadcastDialog(false)} sx={{ borderRadius: '4px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateBroadcast}
            sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600 }}
          >
            Broadcast to All Staff
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
