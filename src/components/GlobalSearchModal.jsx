import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Assignment as TaskIcon,
  EventBusy as LeaveIcon,
  DateRange as WeekIcon,
  AssignmentTurnedIn as EvalIcon,
  LocationOn as GpsIcon,
  Speed as QuickActionIcon,
  Groups as TeamIcon,
  Assessment as ReportIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { searchAPI } from '../services/api';

const QUICK_ACTIONS = [
  {
    id: 'act-punch',
    title: 'GPS Office Attendance & Geofence Punch',
    subtitle: 'Punch in or punch out with verified GPS coordinates',
    type: 'action',
    targetTab: 'attendance',
    icon: GpsIcon
  },
  {
    id: 'act-weekly',
    title: 'Submit 4-Pillar Weekly Check-in',
    subtitle: 'Log your week’s accomplishments, challenges, and goals',
    type: 'action',
    actionType: 'open-weekly-modal',
    icon: WeekIcon
  },
  {
    id: 'act-monthly',
    title: 'Monthly Self-Evaluation Appraisal Form',
    subtitle: 'Open the 13-section monthly performance appraisal',
    type: 'action',
    targetTab: 'self-eval',
    icon: EvalIcon
  },
  {
    id: 'act-leave',
    title: 'Apply for Leave or Short Permission Pass',
    subtitle: 'Submit casual/sick leaves or 1-2 hour permission slips',
    type: 'action',
    targetTab: 'leaves',
    icon: LeaveIcon
  },
  {
    id: 'act-tasks',
    title: 'Team Task Board & Real-Time Tracking',
    subtitle: 'View assigned tasks, update progress sliders, and log work hours',
    type: 'action',
    targetTab: 'task-tracker',
    icon: TaskIcon
  }
];

export default function GlobalSearchModal({ open, onClose, onNavigate, onTriggerAction, isAdmin }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'EMPLOYEES' | 'TASKS' | 'LEAVES' | 'REPORTS' | 'ACTIONS'
  const [results, setResults] = useState({
    employees: [],
    tasks: [],
    leaves: [],
    weeklyReports: [],
    evaluations: []
  });
  const [counts, setCounts] = useState({ total: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('ALL');
      setResults({ employees: [], tasks: [], leaves: [], weeklyReports: [], evaluations: [] });
      setCounts({ total: 0 });
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ employees: [], tasks: [], leaves: [], weeklyReports: [], evaluations: [] });
      setCounts({ total: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchAPI.globalSearch(query);
        setResults(res.data?.results || {});
        setCounts(res.data?.counts || { total: 0 });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [query]);

  // Aggregate items based on activeCategory
  const getDisplayItems = () => {
    if (!query.trim()) {
      return QUICK_ACTIONS;
    }

    let items = [];
    if (activeCategory === 'ALL' || activeCategory === 'EMPLOYEES') {
      items = items.concat(results.employees || []);
    }
    if (activeCategory === 'ALL' || activeCategory === 'TASKS') {
      items = items.concat(results.tasks || []);
    }
    if (activeCategory === 'ALL' || activeCategory === 'LEAVES') {
      items = items.concat(results.leaves || []);
    }
    if (activeCategory === 'ALL' || activeCategory === 'REPORTS') {
      items = items.concat(results.weeklyReports || []);
      items = items.concat(results.evaluations || []);
    }
    if (activeCategory === 'ALL' || activeCategory === 'ACTIONS') {
      const filteredActions = QUICK_ACTIONS.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      items = items.concat(filteredActions);
    }

    return items;
  };

  const displayItems = getDisplayItems();

  const handleSelectItem = (item) => {
    onClose();
    if (item.actionType === 'open-weekly-modal') {
      if (onTriggerAction) onTriggerAction('open-weekly-modal');
    } else if (item.targetTab) {
      if (onNavigate) onNavigate(item.targetTab, item.payload);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems[selectedIndex]) {
        handleSelectItem(displayItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'employee':
        return <PersonIcon sx={{ color: '#133829' }} />;
      case 'task':
        return <TaskIcon sx={{ color: '#0284c7' }} />;
      case 'leave':
        return <LeaveIcon sx={{ color: '#d97706' }} />;
      case 'weeklyReport':
        return <WeekIcon sx={{ color: '#16a34a' }} />;
      case 'evaluation':
        return <EvalIcon sx={{ color: '#9333ea' }} />;
      default:
        return <QuickActionIcon sx={{ color: '#475569' }} />;
    }
  };

  const getItemTypeBadge = (type) => {
    switch (type) {
      case 'employee':
        return <Chip label="Staff" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#e8f5e9', color: '#133829', borderRadius: '4px' }} />;
      case 'task':
        return <Chip label="Task" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }} />;
      case 'leave':
        return <Chip label="Leave" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#fef3c7', color: '#b45309', borderRadius: '4px' }} />;
      case 'weeklyReport':
        return <Chip label="Weekly" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', borderRadius: '4px' }} />;
      case 'evaluation':
        return <Chip label="Monthly" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#f3e8ff', color: '#7e22ce', borderRadius: '4px' }} />;
      default:
        return <Chip label="Action" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569', borderRadius: '4px' }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '4px',
          overflow: 'hidden',
          top: { xs: 0, sm: -100 },
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      {/* Top Search Input Bar */}
      <Box sx={{ p: 2, pb: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Search staff, tasks, leaves, reports, or quick actions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#133829', fontSize: 24, mr: 1 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={20} sx={{ mr: 1, color: '#133829' }} />}
                {query && (
                  <IconButton size="small" onClick={() => setQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                <Chip label="ESC" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, borderRadius: '4px', bgcolor: '#f1f5f9' }} />
              </InputAdornment>
            ),
            sx: { fontSize: '1.05rem', fontWeight: 600 }
          }}
        />

        {/* Category Filter Chips */}
        {query.trim() && (
          <Box sx={{ display: 'flex', gap: 0.8, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={`All (${counts.total || 0})`}
              size="small"
              onClick={() => setActiveCategory('ALL')}
              sx={{
                fontWeight: 700,
                borderRadius: '4px',
                bgcolor: activeCategory === 'ALL' ? '#133829' : '#f1f5f9',
                color: activeCategory === 'ALL' ? '#ffffff' : '#475569'
              }}
            />
            {results.employees?.length > 0 && (
              <Chip
                label={`Staff (${results.employees.length})`}
                size="small"
                onClick={() => setActiveCategory('EMPLOYEES')}
                sx={{
                  fontWeight: 700,
                  borderRadius: '4px',
                  bgcolor: activeCategory === 'EMPLOYEES' ? '#133829' : '#f1f5f9',
                  color: activeCategory === 'EMPLOYEES' ? '#ffffff' : '#475569'
                }}
              />
            )}
            {results.tasks?.length > 0 && (
              <Chip
                label={`Tasks (${results.tasks.length})`}
                size="small"
                onClick={() => setActiveCategory('TASKS')}
                sx={{
                  fontWeight: 700,
                  borderRadius: '4px',
                  bgcolor: activeCategory === 'TASKS' ? '#133829' : '#f1f5f9',
                  color: activeCategory === 'TASKS' ? '#ffffff' : '#475569'
                }}
              />
            )}
            {results.leaves?.length > 0 && (
              <Chip
                label={`Leaves (${results.leaves.length})`}
                size="small"
                onClick={() => setActiveCategory('LEAVES')}
                sx={{
                  fontWeight: 700,
                  borderRadius: '4px',
                  bgcolor: activeCategory === 'LEAVES' ? '#133829' : '#f1f5f9',
                  color: activeCategory === 'LEAVES' ? '#ffffff' : '#475569'
                }}
              />
            )}
            {(results.weeklyReports?.length > 0 || results.evaluations?.length > 0) && (
              <Chip
                label={`Reports (${(results.weeklyReports?.length || 0) + (results.evaluations?.length || 0)})`}
                size="small"
                onClick={() => setActiveCategory('REPORTS')}
                sx={{
                  fontWeight: 700,
                  borderRadius: '4px',
                  bgcolor: activeCategory === 'REPORTS' ? '#133829' : '#f1f5f9',
                  color: activeCategory === 'REPORTS' ? '#ffffff' : '#475569'
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Results / Suggestions Body */}
      <DialogContent sx={{ p: 0, maxHeight: 420, overflowY: 'auto' }}>
        {!query.trim() && (
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, px: 1, letterSpacing: '0.04em' }}>
              FREQUENT ACTIONS & WORKSPACE SHORTCUTS
            </Typography>
          </Box>
        )}

        {displayItems.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              No matches found for "{query}"
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Try searching with an employee name, email, task title, or project keyword.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {displayItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon;

              return (
                <ListItemButton
                  key={item.id || idx}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    px: 2.5,
                    py: 1.2,
                    bgcolor: isSelected ? '#f0fdf4' : 'transparent',
                    borderLeft: isSelected ? '3px solid #133829' : '3px solid transparent',
                    '&:hover': { bgcolor: '#f0fdf4' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    {IconComp ? <IconComp sx={{ color: '#133829' }} /> : getItemIcon(item.type)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.title}
                        </Typography>
                        {getItemTypeBadge(item.type)}
                        {item.priority && (
                          <Chip label={item.priority} size="small" color={item.priority === 'High' || item.priority === 'Urgent' ? 'error' : 'default'} sx={{ height: 16, fontSize: 9, fontWeight: 700, borderRadius: '4px' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {item.subtitle}
                      </Typography>
                    }
                  />

                  <ArrowIcon sx={{ fontSize: 16, color: isSelected ? '#133829' : '#cbd5e1' }} />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>

      {/* Modal Bottom Keyboard Shortcuts Helper */}
      <Box sx={{ px: 2.5, py: 1, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            <span style={{ fontWeight: 800 }}>↑ / ↓</span> Navigate
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            <span style={{ fontWeight: 800 }}>↵ Enter</span> Select
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            <span style={{ fontWeight: 800 }}>Esc</span> Dismiss
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#133829', fontWeight: 700 }}>
          Shazu Soft Universal Search
        </Typography>
      </Box>
    </Dialog>
  );
}
