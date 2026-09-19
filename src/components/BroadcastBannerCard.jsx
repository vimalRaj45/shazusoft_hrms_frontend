import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Campaign as MegaphoneIcon,
  Cake as CakeIcon,
  Celebration as PartyIcon,
  EmojiEvents as TrophyIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CampaignOutlined as AddBroadcastIcon,
  DeleteOutline as DeleteIcon,
  AutoAwesome as SparklesIcon,
  OpenInNew as ExternalLinkIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ticketsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/muiToast';

const CATEGORY_THEMES = {
  birthday: {
    label: 'Birthday Wish',
    icon: CakeIcon,
    tag: 'BIRTHDAY 🎂',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)',
    accentColor: '#ffe4e6',
    chipBg: 'rgba(255, 255, 255, 0.22)',
    chipColor: '#ffffff',
    border: '1px solid rgba(254, 205, 211, 0.35)',
    glow: '0 8px 24px rgba(225, 29, 72, 0.22)',
    defaultImg: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80'
  },
  celebration: {
    label: 'Festival & Celebration',
    icon: PartyIcon,
    tag: 'CELEBRATION 🎉',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)',
    accentColor: '#fef3c7',
    chipBg: 'rgba(255, 255, 255, 0.22)',
    chipColor: '#ffffff',
    border: '1px solid rgba(253, 230, 138, 0.35)',
    glow: '0 8px 24px rgba(217, 119, 6, 0.22)',
    defaultImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
  },
  milestone: {
    label: 'Achievement & Milestone',
    icon: TrophyIcon,
    tag: 'MILESTONE 🏆',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #312e81 100%)',
    accentColor: '#e0e7ff',
    chipBg: 'rgba(255, 255, 255, 0.22)',
    chipColor: '#ffffff',
    border: '1px solid rgba(199, 210, 254, 0.35)',
    glow: '0 8px 24px rgba(79, 70, 229, 0.22)',
    defaultImg: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80'
  },
  urgent: {
    label: 'Important Alert',
    icon: WarningIcon,
    tag: 'URGENT NOTICE ⚠️',
    gradient: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 50%, #7f1d1d 100%)',
    accentColor: '#fee2e2',
    chipBg: 'rgba(255, 255, 255, 0.25)',
    chipColor: '#ffffff',
    border: '1px solid rgba(254, 202, 202, 0.35)',
    glow: '0 8px 24px rgba(185, 28, 28, 0.22)'
  },
  announcement: {
    label: 'Company Announcement',
    icon: MegaphoneIcon,
    tag: 'OFFICIAL BULLETIN 📢',
    gradient: 'linear-gradient(135deg, #133829 0%, #0d281e 50%, #061711 100%)',
    accentColor: '#dcfce7',
    chipBg: 'rgba(255, 255, 255, 0.18)',
    chipColor: '#ffffff',
    border: '1px solid rgba(167, 243, 208, 0.35)',
    glow: '0 8px 24px rgba(19, 56, 41, 0.25)'
  }
};

const TEMPLATE_PRESETS = [
  {
    name: '🎂 Birthday Wish',
    category: 'birthday',
    title: 'Happy Birthday from Shazu Soft!',
    content: 'Wishing you a very Happy Birthday filled with joy, success, and prosperity! May this year bring exciting milestones.',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: '🎉 Festival Celebration',
    category: 'celebration',
    title: 'Festive Greetings to the Team!',
    content: 'Wishing all our team members and their families joy, peace, and vibrant celebrations on this special festive occasion.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: '🏆 Project Milestone',
    category: 'milestone',
    title: 'Kudos on Reaching Project Milestone!',
    content: 'Huge congratulations to our engineering and product teams for delivering the sprint goals ahead of schedule with 100% test coverage!',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: '📢 Townhall / Meet',
    category: 'announcement',
    title: 'Monthly All-Hands Meeting',
    content: 'Join us this Friday for our monthly organizational townhall covering company roadmap, wins, and team recognition.',
    imageUrl: ''
  }
];

export default function BroadcastBannerCard({ onRefreshParent }) {
  const { user, isAdmin } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('shazusoft_dismissed_broadcasts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isPaused, setIsPaused] = useState(false);

  // Creation Modal State
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    category: 'birthday',
    priority: 'Normal',
    image_url: '',
    action_label: '',
    action_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef(null);

  // Fetch Broadcasts
  const fetchBroadcasts = async () => {
    try {
      const res = await ticketsAPI.getBroadcasts();
      setBroadcasts(res.data?.broadcasts || []);
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  // Filter out dismissed broadcasts unless user is admin
  const visibleBroadcasts = broadcasts.filter(b => !dismissedIds.includes(b.id));

  // Auto carousel rotation (every 7.5s)
  useEffect(() => {
    if (visibleBroadcasts.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % visibleBroadcasts.length);
    }, 7500);

    return () => clearInterval(interval);
  }, [visibleBroadcasts.length, isPaused]);

  // Adjust current index if it exceeds array length
  useEffect(() => {
    if (currentIndex >= visibleBroadcasts.length && visibleBroadcasts.length > 0) {
      setCurrentIndex(0);
    }
  }, [visibleBroadcasts.length, currentIndex]);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('shazusoft_dismissed_broadcasts', JSON.stringify(updated));
    } catch (e) {}
    toast.success('Announcement banner dismissed.');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this broadcast?')) return;
    try {
      await ticketsAPI.deleteBroadcast(id);
      toast.success('Broadcast announcement removed.');
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      toast.error('Failed to delete broadcast.');
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? visibleBroadcasts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % visibleBroadcasts.length);
  };

  // Image Upload Handling
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setCreateForm(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectTemplate = (tpl) => {
    setCreateForm({
      title: tpl.title,
      content: tpl.content,
      category: tpl.category,
      priority: 'Normal',
      image_url: tpl.imageUrl || '',
      action_label: '',
      action_url: ''
    });
    setPreviewImage(tpl.imageUrl || '');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast.error('Please provide a title and message content.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ticketsAPI.createBroadcast({
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        category: createForm.category,
        priority: createForm.priority,
        image_url: createForm.image_url?.trim() || null,
        action_label: createForm.action_label?.trim() || null,
        action_url: createForm.action_url?.trim() || null
      });

      toast.success('Announcement broadcasted successfully!');
      setOpenCreateModal(false);
      setCreateForm({
        title: '',
        content: '',
        category: 'birthday',
        priority: 'Normal',
        image_url: '',
        action_label: '',
        action_url: ''
      });
      setPreviewImage('');
      fetchBroadcasts();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dispatch broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  // If no broadcasts and not admin, return null
  if (!loading && visibleBroadcasts.length === 0 && !isAdmin) {
    return null;
  }

  // If no broadcasts but user is admin, show a small attractive "Post Announcement" bar
  if (!loading && visibleBroadcasts.length === 0 && isAdmin) {
    return (
      <Box sx={{ mb: 2.5 }}>
        <Box
          onClick={() => setOpenCreateModal(true)}
          sx={{
            p: 1.5,
            px: 2.5,
            borderRadius: '12px',
            bgcolor: '#ffffff',
            border: '1.5px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#133829',
              bgcolor: '#f8fafc',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#ecfdf5',
                color: '#133829',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MegaphoneIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Broadcast Center • Birthday Wishes & Announcements
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Post company-wide celebratory cards with photos, flyers, or notices to all staff.
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="contained"
            startIcon={<SparklesIcon />}
            sx={{
              fontWeight: 800,
              bgcolor: '#133829',
              borderRadius: '8px',
              fontSize: 12,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0b2319' }
            }}
          >
            Post Announcement
          </Button>
        </Box>

        {/* Modal render */}
        {renderCreateModal()}
      </Box>
    );
  }

  if (loading || visibleBroadcasts.length === 0) return null;

  const activeBroadcast = visibleBroadcasts[currentIndex] || visibleBroadcasts[0];
  const catKey = (activeBroadcast.category || 'announcement').toLowerCase();
  const theme = CATEGORY_THEMES[catKey] || CATEGORY_THEMES.announcement;
  const CategoryIcon = theme.icon;
  const hasImage = Boolean(activeBroadcast.image_url);

  function renderCreateModal() {
    return (
      <Dialog
        open={openCreateModal}
        onClose={() => !submitting && setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', overflow: 'hidden' }
        }}
      >
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle
            sx={{
              bgcolor: '#133829',
              color: '#ffffff',
              fontWeight: 800,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <SparklesIcon sx={{ color: '#86efac' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>
                Publish Broadcast Card
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenCreateModal(false)} sx={{ color: '#ffffff' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
            {/* Template Quick Selection */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block', mb: 1 }}>
              QUICK TEMPLATES
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
              {TEMPLATE_PRESETS.map((tpl) => (
                <Chip
                  key={tpl.name}
                  label={tpl.name}
                  clickable
                  onClick={() => handleSelectTemplate(tpl)}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#133829' }
                  }}
                />
              ))}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Category & Theme"
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                >
                  <MenuItem value="birthday">🎂 Birthday Wish</MenuItem>
                  <MenuItem value="celebration">🎉 Festival & Celebration</MenuItem>
                  <MenuItem value="milestone">🏆 Milestone & Kudos</MenuItem>
                  <MenuItem value="announcement">📢 Company Announcement</MenuItem>
                  <MenuItem value="urgent">⚠️ Urgent Notice</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Broadcast Priority"
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent Alert</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Broadcast Title / Headline"
                  placeholder="e.g., Happy Birthday Alex! 🎂"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  required
                  size="small"
                  label="Announcement Message"
                  placeholder="Write celebratory message or official bulletin..."
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                />
              </Grid>

              {/* Image Upload / URL Input */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 1 }}>
                    CARD IMAGE / PHOTO (OPTIONAL)
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddPhotoIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ fontWeight: 700, borderRadius: '8px', fontSize: 12 }}
                    >
                      Upload Photo / Flyer
                    </Button>

                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      or paste image URL below
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="https://example.com/banner-photo.jpg"
                    value={createForm.image_url}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, image_url: e.target.value });
                      setPreviewImage(e.target.value);
                    }}
                  />

                  {previewImage && (
                    <Box sx={{ mt: 1.5, position: 'relative', width: '100%', height: 120, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <Box
                        component="img"
                        src={previewImage}
                        alt="Preview"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setPreviewImage('')}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setPreviewImage('');
                          setCreateForm(prev => ({ ...prev, image_url: '' }));
                        }}
                        sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Optional Call to Action */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Button Label (Optional)"
                  placeholder="e.g., Send Wishes, View Details"
                  value={createForm.action_label}
                  onChange={(e) => setCreateForm({ ...createForm, action_label: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Button Link / Tab URL (Optional)"
                  placeholder="e.g., /?tab=chat-hub or https://..."
                  value={createForm.action_url}
                  onChange={(e) => setCreateForm({ ...createForm, action_url: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={() => setOpenCreateModal(false)} disabled={submitting} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <MegaphoneIcon />}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                bgcolor: '#133829',
                px: 3,
                '&:hover': { bgcolor: '#0b2319' }
              }}
            >
              {submitting ? 'Broadcasting...' : 'Publish Broadcast'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  return (
    <Box sx={{ mb: 2.5 }}>
      <Card
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        sx={{
          position: 'relative',
          borderRadius: '14px',
          background: theme.gradient,
          color: '#ffffff',
          boxShadow: theme.glow,
          border: theme.border,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        }}
      >
        {/* Decorative Top/Side Particle Circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            left: 80,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <CardContent sx={{ p: { xs: 2, sm: 2.2 }, '&:last-child': { pb: { xs: 2, sm: 2.2 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {/* Left Section: Image / Badge + Text Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
              {/* Image or Icon Avatar */}
              {hasImage ? (
                <Box
                  sx={{
                    width: { xs: 60, sm: 76 },
                    height: { xs: 60, sm: 76 },
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    bgcolor: 'rgba(0,0,0,0.2)'
                  }}
                >
                  <Box
                    component="img"
                    src={activeBroadcast.image_url}
                    alt={activeBroadcast.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'scale(1.08)' }
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: { xs: 48, sm: 54 },
                    height: { xs: 48, sm: 54 },
                    borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <CategoryIcon sx={{ fontSize: { xs: 26, sm: 30 }, color: '#ffffff' }} />
                </Box>
              )}

              {/* Text Information */}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={theme.tag}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 9.5,
                      fontWeight: 800,
                      bgcolor: theme.chipBg,
                      color: theme.chipColor,
                      backdropFilter: 'blur(6px)',
                      borderRadius: '5px',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />

                  {activeBroadcast.created_at && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>
                      {format(new Date(activeBroadcast.created_at), 'dd MMM, hh:mm a')}
                    </Typography>
                  )}

                  {visibleBroadcasts.length > 1 && (
                    <Chip
                      label={`${currentIndex + 1} of ${visibleBroadcasts.length}`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 9,
                        fontWeight: 800,
                        bgcolor: 'rgba(0,0,0,0.25)',
                        color: '#ffffff',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    lineHeight: 1.25,
                    color: '#ffffff',
                    mb: 0.4,
                    textShadow: '0 1px 2px rgba(0,0,0,0.25)'
                  }}
                >
                  {activeBroadcast.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.92)',
                    fontSize: { xs: 12, sm: 13 },
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {activeBroadcast.content}
                </Typography>
              </Box>
            </Box>

            {/* Right Action Buttons & Carousel Navigation */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
                alignSelf: { xs: 'flex-end', sm: 'center' }
              }}
            >
              {/* Optional Call to Action */}
              {activeBroadcast.action_label && (
                <Button
                  size="small"
                  variant="contained"
                  href={activeBroadcast.action_url || '#'}
                  target={activeBroadcast.action_url?.startsWith('http') ? '_blank' : '_self'}
                  endIcon={<ExternalLinkIcon sx={{ fontSize: '14px !important' }} />}
                  sx={{
                    bgcolor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: 11.5,
                    borderRadius: '7px',
                    textTransform: 'none',
                    px: 1.8,
                    py: 0.6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: '#f8fafc', color: '#000' }
                  }}
                >
                  {activeBroadcast.action_label}
                </Button>
              )}

              {/* Multi-Broadcast Navigation Arrows */}
              {visibleBroadcasts.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.22)', borderRadius: '8px', p: 0.2 }}>
                  <IconButton
                    size="small"
                    onClick={handlePrev}
                    sx={{ color: '#ffffff', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                  >
                    <PrevIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleNext}
                    sx={{ color: '#ffffff', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                  >
                    <NextIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Admin Actions: Post Announcement + Delete */}
              {isAdmin && (
                <>
                  <Tooltip title="Post New Broadcast / Celebration Card">
                    <IconButton
                      size="small"
                      onClick={() => setOpenCreateModal(true)}
                      sx={{
                        color: '#ffffff',
                        bgcolor: 'rgba(255,255,255,0.18)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <AddBroadcastIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete this Broadcast">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(activeBroadcast.id)}
                      sx={{
                        color: '#ffffff',
                        bgcolor: 'rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.4)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* Dismiss Button */}
              <Tooltip title="Dismiss this announcement">
                <IconButton
                  size="small"
                  onClick={() => handleDismiss(activeBroadcast.id)}
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Modal for Admin Creating Broadcast */}
      {renderCreateModal()}
    </Box>
  );
}
