import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { timeTo24h } from '../utils/timeUtils';

/**
 * Standard 12-Hour Time Picker & Input Component
 * Replaces 24-hour inputs across Shazusoft HRMS.
 * Guarantees that time is ALWAYS displayed, selected, and edited in 12-hour AM/PM format.
 * Supports exact minute typing, keyboard stepping, clock wheel, and preset picks.
 *
 * Emits synthetic event with:
 *   e.target.value: 24h "HH:mm" (for backend compatibility)
 *   e.target.value12h: 12h "hh:mm A" (e.g. "09:12 AM" or "04:30 PM")
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
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Synchronize when external value changes
  useEffect(() => {
    const p = parseTime(value);
    setHour(p.hour);
    setMinute(p.minute);
    setAmpm(p.ampm);
  }, [value]);

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
    // If user typed 24h number like 16, 18, convert automatically to 12h PM
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

    // Auto-advance to minute field if 2 digits entered or if number >= 2 (since in 12h clock hours are 01-12)
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

  const handlePresetSelect = (preset12h) => {
    const p = parseTime(preset12h);
    setHour(p.hour);
    setMinute(p.minute);
    setAmpm(p.ampm);
    emitChange(p.hour, p.minute, p.ampm);
    setMenuAnchor(null);
  };

  // Set to real-world current local time
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
    setMenuAnchor(null);
  };

  const COMMON_PRESETS = [
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:15 AM',
    '09:30 AM',
    '09:45 AM',
    '10:00 AM',
    '10:15 AM',
    '10:30 AM',
    '11:00 AM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '04:30 PM',
    '05:00 PM',
    '05:30 PM',
    '05:45 PM',
    '06:00 PM',
    '06:30 PM',
    '07:00 PM',
    '07:30 PM',
    '08:00 PM',
    '08:30 PM',
    '09:00 PM',
    '10:00 PM'
  ];

  const current12hDisplay = `${hour || '12'}:${minute || '00'} ${ampm}`;

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
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
            <Chip
              size="small"
              label={current12hDisplay}
              sx={{
                height: 18,
                fontSize: '0.7rem',
                fontWeight: 800,
                bgcolor: ampm === 'PM' ? '#dcfce7' : '#e0f2fe',
                color: ampm === 'PM' ? '#15803d' : '#0369a1',
                border: `1px solid ${ampm === 'PM' ? '#86efac' : '#bae6fd'}`
              }}
            />
          </Box>
        </Box>
      )}

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
        {/* Native clock picker helper */}
        <input
          type="time"
          disabled={disabled}
          value={timeTo24h(`${hour || '12'}:${minute || '00'} ${ampm}`)}
          onChange={(e) => {
            if (!e.target.value) return;
            const p = parseTime(e.target.value);
            setHour(p.hour);
            setMinute(p.minute);
            setAmpm(p.ampm);
            emitChange(p.hour, p.minute, p.ampm);
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0
          }}
          id={`time-picker-native-${label ? label.replace(/\s+/g, '-').toLowerCase() : 'field'}`}
        />

        <Tooltip title="Click for interactive visual clock dialog">
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => {
              const el = document.getElementById(`time-picker-native-${label ? label.replace(/\s+/g, '-').toLowerCase() : 'field'}`);
              if (el && el.showPicker) {
                try { el.showPicker(); } catch (e) { el.click(); }
              }
            }}
            sx={{ p: 0.4, color: '#133829' }}
          >
            <AccessTimeIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Hour Input (1-12) */}
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

        {/* Minute Input (00-59, type any exact minute e.g. 12, 23, 41) */}
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

        {/* Quick Presets & Options Dropdown */}
        <Tooltip title="Preset Templates & Exact Options">
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ p: 0.3, color: '#64748b' }}
            >
              <ArrowDropDownIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          PaperProps={{
            sx: { maxHeight: 300, width: 170, borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }
          }}
        >
          <MenuItem
            onClick={handleSetCurrentTime}
            sx={{
              fontSize: '0.8rem',
              fontWeight: 800,
              py: 0.8,
              bgcolor: '#ecfdf5',
              color: '#047857',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              '&:hover': { bgcolor: '#d1fae5' }
            }}
          >
            <FlashOnIcon sx={{ fontSize: 16 }} />
            Current Time (Now)
          </MenuItem>
          {COMMON_PRESETS.map((preset) => (
            <MenuItem
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              selected={preset === current12hDisplay}
              sx={{ fontSize: '0.8rem', fontWeight: 700, py: 0.6 }}
            >
              {preset}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {helperText && (
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.4, fontSize: '0.72rem' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
