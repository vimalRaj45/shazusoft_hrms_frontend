import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ButtonGroup,
  Popover,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightIcon from '@mui/icons-material/Nightlight';
import { timeTo24h } from '../utils/timeUtils';

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const ALL_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const QUICK_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const PRESET_SHIFTS = [
  { label: '08:00 AM (Early)', val: '08:00 AM' },
  { label: '09:00 AM (Start)', val: '09:00 AM' },
  { label: '09:30 AM (Standard Office)', val: '09:30 AM' },
  { label: '09:45 AM (Grace Cutoff)', val: '09:45 AM' },
  { label: '10:00 AM (Mid Start)', val: '10:00 AM' },
  { label: '10:15 AM (Part-Time Grace)', val: '10:15 AM' },
  { label: '01:00 PM (Lunch Return)', val: '01:00 PM' },
  { label: '04:30 PM (Part-Time End)', val: '04:30 PM' },
  { label: '06:00 PM (Early End)', val: '06:00 PM' },
  { label: '06:30 PM (Standard Close)', val: '06:30 PM' },
  { label: '07:00 PM (Overtime 1)', val: '07:00 PM' },
  { label: '08:00 PM (Late Shift)', val: '08:00 PM' },
  { label: '08:30 PM (Night Close)', val: '08:30 PM' }
];

/**
 * Standard 12-Hour Time Picker with Full Visual Chooser Popover
 * Supports exact minute selection (00-59), visual hour dial, AM/PM toggle, steppers, and direct typing.
 */
export default function TimePicker12h({
  label,
  value,
  onChange,
  helperText,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'small',
  sx = {}
}) {
  const hourInputRef = useRef(null);
  const minuteInputRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const containerRef = useRef(null);

  // Parse incoming value (can be "16:30", "04:30 PM", "10:00", etc.)
  const parseTime = (val) => {
    if (!val || val === '--' || val === '--:--' || val === 'In Progress') {
      return { hour: '09', minute: '30', ampm: 'AM' };
    }

    const trimmed = String(val).trim();

    // 12-hour format "04:30 PM" or "9:15 AM"
    const m12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (m12) {
      const h = parseInt(m12[1], 10);
      const boundedH = h === 0 ? 12 : (h > 12 ? (h % 12 || 12) : h);
      return {
        hour: String(boundedH).padStart(2, '0'),
        minute: m12[2].padStart(2, '0'),
        ampm: m12[3].toUpperCase()
      };
    }

    // 24-hour format "16:30" or "18:30:00"
    const m24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m24) {
      const h24 = parseInt(m24[1], 10);
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      return {
        hour: String(h12).padStart(2, '0'),
        minute: m24[2].padStart(2, '0'),
        ampm
      };
    }

    return { hour: '09', minute: '30', ampm: 'AM' };
  };

  const initial = parseTime(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmpm] = useState(initial.ampm);

  // Popover State
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const isChooserOpen = Boolean(popoverAnchor);

  // Synchronize when external value changes
  useEffect(() => {
    const p = parseTime(value);
    setHour(p.hour);
    setMinute(p.minute);
    setAmpm(p.ampm);
  }, [value]);

  // Scroll active minute into view when popover opens
  useEffect(() => {
    if (isChooserOpen && minuteScrollRef.current) {
      const activeEl = minuteScrollRef.current.querySelector(`[data-minute="${minute}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [isChooserOpen, minute]);

  const emitChange = (h, m, ap) => {
    let intH = parseInt(h, 10) || 12;
    if (intH < 1) intH = 1;
    if (intH > 12) intH = 12;
    const cleanH = String(intH).padStart(2, '0');

    let intM = parseInt(m, 10) || 0;
    if (intM < 0) intM = 0;
    if (intM > 59) intM = 59;
    const cleanM = String(intM).padStart(2, '0');

    // Calculate 24h string for backend persistence
    let h24 = intH;
    if (ap === 'PM' && intH < 12) h24 += 12;
    if (ap === 'AM' && intH === 12) h24 = 0;
    const str24 = `${String(h24).padStart(2, '0')}:${cleanM}`;
    const str12 = `${cleanH}:${cleanM} ${ap}`;

    if (onChange) {
      onChange({
        target: {
          value: str24,
          value12h: str12
        }
      });
    }
  };

  const handleHourChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (!raw) {
      setHour('');
      return;
    }
    let num = parseInt(raw, 10);
    if (num > 12 && num < 24) {
      num = num - 12;
      setAmpm('PM');
      const formatted = String(num).padStart(2, '0');
      setHour(formatted);
      emitChange(formatted, minute, 'PM');
      if (minuteInputRef.current) minuteInputRef.current.focus();
      return;
    }
    if (num > 12) num = 12;
    const formatted = String(num).padStart(2, '0');
    setHour(formatted);
    emitChange(formatted, minute, ampm);

    if (raw.length === 2 || (num >= 2 && num <= 9)) {
      if (minuteInputRef.current) {
        minuteInputRef.current.focus();
        minuteInputRef.current.select();
      }
    }
  };

  const handleHourKeyDown = (e) => {
    if (e.key === ':' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (minuteInputRef.current) {
        minuteInputRef.current.focus();
        minuteInputRef.current.select();
      }
    } else if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      handleAmpmToggle('AM');
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      handleAmpmToggle('PM');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentH = parseInt(hour, 10) || 12;
      const nextH = currentH >= 12 ? 1 : currentH + 1;
      const formatted = String(nextH).padStart(2, '0');
      setHour(formatted);
      emitChange(formatted, minute, ampm);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentH = parseInt(hour, 10) || 12;
      const prevH = currentH <= 1 ? 12 : currentH - 1;
      const formatted = String(prevH).padStart(2, '0');
      setHour(formatted);
      emitChange(formatted, minute, ampm);
    }
  };

  const handleHourBlur = () => {
    if (!hour || parseInt(hour, 10) < 1) {
      setHour('12');
      emitChange('12', minute, ampm);
    } else {
      const formatted = String(parseInt(hour, 10)).padStart(2, '0');
      setHour(formatted);
    }
  };

  const handleMinuteChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (!raw) {
      setMinute('');
      return;
    }
    let num = parseInt(raw, 10);
    if (num > 59) num = 59;
    const formatted = String(num).padStart(2, '0');
    setMinute(formatted);
    emitChange(hour, formatted, ampm);
  };

  const handleMinuteKeyDown = (e) => {
    if (e.key === 'Backspace' && !minute) {
      e.preventDefault();
      if (hourInputRef.current) {
        hourInputRef.current.focus();
        hourInputRef.current.select();
      }
    } else if (e.key === 'ArrowLeft') {
      if (hourInputRef.current) {
        hourInputRef.current.focus();
        hourInputRef.current.select();
      }
    } else if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      handleAmpmToggle('AM');
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      handleAmpmToggle('PM');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const currentM = parseInt(minute, 10) || 0;
      const nextM = (currentM + step) % 60;
      const formatted = String(nextM).padStart(2, '0');
      setMinute(formatted);
      emitChange(hour, formatted, ampm);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const currentM = parseInt(minute, 10) || 0;
      let prevM = currentM - step;
      if (prevM < 0) prevM = 60 + prevM;
      const formatted = String(prevM).padStart(2, '0');
      setMinute(formatted);
      emitChange(hour, formatted, ampm);
    }
  };

  const handleMinuteBlur = () => {
    if (!minute) {
      setMinute('00');
      emitChange(hour, '00', ampm);
    } else {
      const formatted = String(parseInt(minute, 10)).padStart(2, '0');
      setMinute(formatted);
    }
  };

  const handleAmpmToggle = (newAp) => {
    if (newAp === ampm) return;
    setAmpm(newAp);
    emitChange(hour, minute, newAp);
  };

  // Direct Selection Handlers for Full Chooser Popover
  const handleSelectHour = (selectedH) => {
    setHour(selectedH);
    emitChange(selectedH, minute, ampm);
  };

  const handleSelectMinute = (selectedM) => {
    setMinute(selectedM);
    emitChange(hour, selectedM, ampm);
  };

  const handleSelectAmpm = (selectedAp) => {
    setAmpm(selectedAp);
    emitChange(hour, minute, selectedAp);
  };

  const handleStepMinute = (delta) => {
    let intH = parseInt(hour, 10) || 12;
    let intM = parseInt(minute, 10) || 0;
    let curAp = ampm;

    let totalMins = (intH % 12) * 60 + intM + delta;
    if (curAp === 'PM') totalMins += 12 * 60;

    totalMins = (totalMins + 1440) % 1440;

    const newH24 = Math.floor(totalMins / 60);
    const newM = totalMins % 60;

    const newAp = newH24 >= 12 ? 'PM' : 'AM';
    let newH12 = newH24 % 12;
    if (newH12 === 0) newH12 = 12;

    const cleanH = String(newH12).padStart(2, '0');
    const cleanM = String(newM).padStart(2, '0');

    setHour(cleanH);
    setMinute(cleanM);
    setAmpm(newAp);
    emitChange(cleanH, cleanM, newAp);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    let h24 = now.getHours();
    let m = now.getMinutes();
    const ap = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const cleanH = String(h12).padStart(2, '0');
    const cleanM = String(m).padStart(2, '0');

    setHour(cleanH);
    setMinute(cleanM);
    setAmpm(ap);
    emitChange(cleanH, cleanM, ap);
  };

  const handlePresetSelect = (preset12h) => {
    const p = parseTime(preset12h);
    setHour(p.hour);
    setMinute(p.minute);
    setAmpm(p.ampm);
    emitChange(p.hour, p.minute, p.ampm);
  };

  const current12hDisplay = `${hour || '12'}:${minute || '00'} ${ampm}`;

  return (
    <Box ref={containerRef} sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Tooltip title="Click to fill exact current local time">
              <Chip
                size="small"
                icon={<FlashOnIcon sx={{ fontSize: '11px !important', color: '#0f766e !important' }} />}
                label="Now"
                clickable
                disabled={disabled}
                onClick={handleSetCurrentTime}
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  bgcolor: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  '&:hover': { bgcolor: '#dcfce7' }
                }}
              />
            </Tooltip>
            <Tooltip title="Click to open Full Interactive Time Chooser">
              <Chip
                size="small"
                label={current12hDisplay}
                clickable
                disabled={disabled}
                onClick={(e) => setPopoverAnchor(containerRef.current || e.currentTarget)}
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  bgcolor: ampm === 'PM' ? '#dcfce7' : '#e0f2fe',
                  color: ampm === 'PM' ? '#15803d' : '#0369a1',
                  border: `1px solid ${ampm === 'PM' ? '#86efac' : '#bae6fd'}`,
                  '&:hover': { transform: 'scale(1.05)' },
                  transition: 'all 0.15s ease'
                }}
              />
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Main Input Control Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          p: '4px 6px',
          bgcolor: disabled ? '#f1f5f9' : '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          '&:focus-within': {
            borderColor: '#133829',
            boxShadow: '0 0 0 2px rgba(19, 56, 41, 0.15)'
          }
        }}
      >
        <Tooltip title="Click to Open Full Interactive Time Chooser Dialog">
          <IconButton
            size="small"
            disabled={disabled}
            onClick={(e) => setPopoverAnchor(containerRef.current || e.currentTarget)}
            sx={{
              p: 0.4,
              color: '#133829',
              bgcolor: '#f1f5f9',
              borderRadius: '6px',
              '&:hover': { bgcolor: '#e2e8f0', transform: 'scale(1.08)' }
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Hour Direct Input */}
        <TextField
          inputRef={hourInputRef}
          size="small"
          disabled={disabled}
          value={hour}
          onChange={handleHourChange}
          onKeyDown={handleHourKeyDown}
          onBlur={handleHourBlur}
          placeholder="HH"
          inputProps={{
            maxLength: 2,
            style: {
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '5px 4px',
              width: '32px'
            }
          }}
          sx={{
            width: 44,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
            '& .MuiInputBase-root': { bgcolor: '#f8fafc', borderRadius: '6px' }
          }}
        />

        <Typography sx={{ fontWeight: 800, color: '#64748b', fontSize: '1rem' }}>:</Typography>

        {/* Minute Direct Input (Any Exact Minute 00-59) */}
        <TextField
          inputRef={minuteInputRef}
          size="small"
          disabled={disabled}
          value={minute}
          onChange={handleMinuteChange}
          onKeyDown={handleMinuteKeyDown}
          onBlur={handleMinuteBlur}
          placeholder="MM"
          inputProps={{
            maxLength: 2,
            style: {
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '5px 4px',
              width: '32px'
            }
          }}
          sx={{
            width: 44,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
            '& .MuiInputBase-root': { bgcolor: '#f8fafc', borderRadius: '6px' }
          }}
        />

        {/* AM / PM Segmented Control */}
        <ButtonGroup size="small" sx={{ ml: 'auto', height: 28 }}>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => handleAmpmToggle('AM')}
            variant={ampm === 'AM' ? 'contained' : 'outlined'}
            sx={{
              px: 1.2,
              py: 0,
              fontSize: '0.75rem',
              fontWeight: 800,
              borderRadius: '6px 0 0 6px',
              bgcolor: ampm === 'AM' ? '#0284c7' : 'transparent',
              borderColor: '#cbd5e1',
              color: ampm === 'AM' ? '#ffffff' : '#64748b',
              '&:hover': {
                bgcolor: ampm === 'AM' ? '#0369a1' : '#f8fafc'
              }
            }}
          >
            AM
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => handleAmpmToggle('PM')}
            variant={ampm === 'PM' ? 'contained' : 'outlined'}
            sx={{
              px: 1.2,
              py: 0,
              fontSize: '0.75rem',
              fontWeight: 800,
              borderRadius: '0 6px 6px 0',
              bgcolor: ampm === 'PM' ? '#133829' : 'transparent',
              borderColor: '#cbd5e1',
              color: ampm === 'PM' ? '#ffffff' : '#64748b',
              '&:hover': {
                bgcolor: ampm === 'PM' ? '#0a2318' : '#f8fafc'
              }
            }}
          >
            PM
          </Button>
        </ButtonGroup>

        {/* Full Chooser Expand Button */}
        <Tooltip title="Open Full Interactive Time Chooser">
          <Button
            size="small"
            variant="text"
            disabled={disabled}
            onClick={(e) => setPopoverAnchor(containerRef.current || e.currentTarget)}
            sx={{
              minWidth: 32,
              p: '2px 4px',
              color: '#475569',
              fontWeight: 800,
              fontSize: 11,
              borderRadius: '6px',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.2,
              '&:hover': { bgcolor: '#f1f5f9', color: '#133829' }
            }}
          >
            <ArrowDropDownIcon fontSize="small" />
          </Button>
        </Tooltip>
      </Box>

      {helperText && (
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.4, fontSize: '0.72rem' }}>
          {helperText}
        </Typography>
      )}

      {/* =========================================================
          FULL VISUAL INTERACTIVE TIME CHOOSER POPOVER
          ========================================================= */}
      <Popover
        open={isChooserOpen}
        anchorEl={popoverAnchor}
        onClose={() => setPopoverAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 0.8,
            width: { xs: 320, sm: 380 },
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            bgcolor: '#ffffff'
          }
        }}
      >
        {/* Chooser Header */}
        <Box
          sx={{
            p: 1.8,
            bgcolor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ p: 0.6, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.12)', display: 'flex' }}>
              <AccessTimeIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Time Chooser
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace', lineHeight: 1.1, color: '#f8fafc' }}>
                {hour || '12'} : {minute || '00'}{' '}
                <span style={{ color: ampm === 'PM' ? '#4ade80' : '#38bdf8', fontSize: '0.9rem' }}>
                  {ampm}
                </span>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Button
              size="small"
              startIcon={<FlashOnIcon sx={{ fontSize: '13px !important' }} />}
              onClick={handleSetCurrentTime}
              sx={{
                fontSize: 11,
                fontWeight: 800,
                color: '#38bdf8',
                bgcolor: 'rgba(56, 189, 248, 0.15)',
                borderRadius: '8px',
                px: 1.2,
                py: 0.3,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.25)' }
              }}
            >
              Set Current Time
            </Button>
            <IconButton size="small" onClick={() => setPopoverAnchor(null)} sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Quick Minute Steppers Bar */}
        <Box sx={{ p: '8px 12px', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>
            Quick Adjust:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[
              { label: '-15m', d: -15 },
              { label: '-5m', d: -5 },
              { label: '-1m', d: -1 },
              { label: '+1m', d: 1 },
              { label: '+5m', d: 5 },
              { label: '+15m', d: 15 }
            ].map(step => (
              <Chip
                key={step.label}
                label={step.label}
                size="small"
                clickable
                onClick={() => handleStepMinute(step.d)}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#e2e8f0' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Main 3-Column Interactive Picker */}
        <Box sx={{ p: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 1.5 }}>
          {/* Column 1: Hour Selector (01 - 12) */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8, fontSize: 11, textAlign: 'center' }}>
              HOUR (1-12)
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0.6,
                p: 0.5,
                bgcolor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              {HOURS.map(h => {
                const isSel = h === hour;
                return (
                  <Button
                    key={h}
                    size="small"
                    onClick={() => handleSelectHour(h)}
                    sx={{
                      minWidth: 0,
                      p: '6px 0',
                      fontWeight: isSel ? 900 : 700,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      borderRadius: '8px',
                      bgcolor: isSel ? '#0f172a' : 'transparent',
                      color: isSel ? '#ffffff' : '#334155',
                      boxShadow: isSel ? '0 2px 6px rgba(15,23,42,0.3)' : 'none',
                      '&:hover': {
                        bgcolor: isSel ? '#1e293b' : '#e2e8f0'
                      }
                    }}
                  >
                    {h}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Column 2: Exact Minute Selector (00 - 59) */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8, fontSize: 11, textAlign: 'center' }}>
              EXACT MINUTE (00-59)
            </Typography>

            {/* Quick 5-min jump chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mb: 0.8, justifyContent: 'center' }}>
              {QUICK_MINUTES.map(qm => (
                <Chip
                  key={qm}
                  label={qm}
                  size="small"
                  clickable
                  onClick={() => handleSelectMinute(qm)}
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: qm === minute ? 900 : 700,
                    fontFamily: 'monospace',
                    bgcolor: qm === minute ? '#059669' : '#ffffff',
                    color: qm === minute ? '#ffffff' : '#475569',
                    border: qm === minute ? '1px solid #059669' : '1px solid #cbd5e1',
                    '&:hover': { bgcolor: qm === minute ? '#047857' : '#f1f5f9' }
                  }}
                />
              ))}
            </Box>

            {/* Scrollable list of ALL 60 Exact Minutes */}
            <Box
              ref={minuteScrollRef}
              sx={{
                maxHeight: 140,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 0.4,
                p: 0.5,
                bgcolor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              {ALL_MINUTES.map(m => {
                const isSel = m === minute;
                return (
                  <Button
                    key={m}
                    data-minute={m}
                    size="small"
                    onClick={() => handleSelectMinute(m)}
                    sx={{
                      minWidth: 0,
                      p: '4px 0',
                      fontWeight: isSel ? 900 : 600,
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      borderRadius: '6px',
                      bgcolor: isSel ? '#10b981' : 'transparent',
                      color: isSel ? '#ffffff' : '#334155',
                      boxShadow: isSel ? '0 2px 4px rgba(16,185,129,0.3)' : 'none',
                      '&:hover': {
                        bgcolor: isSel ? '#059669' : '#e2e8f0'
                      }
                    }}
                  >
                    {m}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Column 3: AM / PM Period Selector */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8, fontSize: 11, textAlign: 'center' }}>
              PERIOD
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', justifyContent: 'center' }}>
              <Button
                variant={ampm === 'AM' ? 'contained' : 'outlined'}
                onClick={() => handleSelectAmpm('AM')}
                startIcon={<WbSunnyIcon />}
                sx={{
                  py: 1.2,
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  bgcolor: ampm === 'AM' ? '#0284c7' : 'transparent',
                  borderColor: '#0284c7',
                  color: ampm === 'AM' ? '#ffffff' : '#0284c7',
                  boxShadow: ampm === 'AM' ? '0 3px 8px rgba(2,132,199,0.35)' : 'none',
                  '&:hover': {
                    bgcolor: ampm === 'AM' ? '#0369a1' : '#f0f9ff',
                    borderColor: '#0284c7'
                  }
                }}
              >
                AM
              </Button>

              <Button
                variant={ampm === 'PM' ? 'contained' : 'outlined'}
                onClick={() => handleSelectAmpm('PM')}
                startIcon={<NightlightIcon />}
                sx={{
                  py: 1.2,
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  bgcolor: ampm === 'PM' ? '#133829' : 'transparent',
                  borderColor: '#133829',
                  color: ampm === 'PM' ? '#ffffff' : '#133829',
                  boxShadow: ampm === 'PM' ? '0 3px 8px rgba(19,56,41,0.35)' : 'none',
                  '&:hover': {
                    bgcolor: ampm === 'PM' ? '#0a2318' : '#f0fdf4',
                    borderColor: '#133829'
                  }
                }}
              >
                PM
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Common Shifts Quick Pick Section */}
        <Box sx={{ p: '8px 12px', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', fontSize: 10, display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
            Official Shift Presets:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 65, overflowY: 'auto' }}>
            {PRESET_SHIFTS.map(preset => (
              <Chip
                key={preset.label}
                label={preset.label}
                size="small"
                clickable
                onClick={() => handlePresetSelect(preset.val)}
                sx={{
                  height: 19,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: preset.val === current12hDisplay ? '#e0f2fe' : '#ffffff',
                  color: preset.val === current12hDisplay ? '#0369a1' : '#475569',
                  border: preset.val === current12hDisplay ? '1px solid #7dd3fc' : '1px solid #cbd5e1',
                  '&:hover': { bgcolor: '#e2e8f0' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Chooser Bottom Action Bar */}
        <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11 }}>
            Selected: <strong style={{ color: '#0f172a' }}>{current12hDisplay}</strong>
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={() => setPopoverAnchor(null)}
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 2,
              py: 0.6,
              bgcolor: '#133829',
              color: '#ffffff',
              '&:hover': { bgcolor: '#0f291e' }
            }}
          >
            Done
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
