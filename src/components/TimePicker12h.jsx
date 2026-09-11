import React, { useState, useEffect } from 'react';
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

/**
 * Standard 12-Hour Time Picker & Input Component
 * Replaces 24-hour inputs across Shazusoft HRMS.
 * Guarantees that time is ALWAYS displayed, selected, and edited in 12-hour AM/PM format.
 *
 * Emits synthetic event with:
 *   e.target.value: 24h "HH:mm" (for backend compatibility)
 *   e.target.value12h: 12h "hh:mm A" (e.g. "04:30 PM")
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
      return;
    }
    if (num > 12) num = 12;
    const formatted = String(num).padStart(2, '0');
    setHour(formatted);
    emitChange(formatted, minute, ampm);
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

  const COMMON_PRESETS = [
    '09:00 AM',
    '09:30 AM',
    '09:45 AM',
    '10:00 AM',
    '10:15 AM',
    '01:00 PM',
    '01:30 PM',
    '04:30 PM',
    '05:00 PM',
    '05:30 PM',
    '05:45 PM',
    '06:00 PM',
    '06:30 PM',
    '07:00 PM',
    '07:30 PM',
    '08:00 PM',
    '08:30 PM'
  ];

  const current12hDisplay = `${hour || '12'}:${minute || '00'} ${ampm}`;

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </Typography>
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
        <AccessTimeIcon sx={{ color: '#64748b', fontSize: 18, ml: 0.5 }} />

        {/* Hour Input (1-12) */}
        <TextField
          size="small"
          disabled={disabled}
          value={hour}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
          placeholder="HH"
          inputProps={{
            maxLength: 2,
            style: {
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '4px 2px',
              width: '28px'
            }
          }}
          sx={{
            width: 36,
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiInputBase-root': { bgcolor: '#f8fafc', borderRadius: '4px' }
          }}
        />

        <Typography sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>:</Typography>

        {/* Minute Input (00-59) */}
        <TextField
          size="small"
          disabled={disabled}
          value={minute}
          onChange={handleMinuteChange}
          onBlur={handleMinuteBlur}
          placeholder="MM"
          inputProps={{
            maxLength: 2,
            style: {
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '4px 2px',
              width: '28px'
            }
          }}
          sx={{
            width: 36,
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiInputBase-root': { bgcolor: '#f8fafc', borderRadius: '4px' }
          }}
        />

        {/* AM / PM Segmented Control */}
        <ButtonGroup size="small" sx={{ ml: 'auto', height: 26 }}>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => handleAmpmToggle('AM')}
            variant={ampm === 'AM' ? 'contained' : 'outlined'}
            sx={{
              px: 1,
              py: 0,
              fontSize: '0.72rem',
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
              px: 1,
              py: 0,
              fontSize: '0.72rem',
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

        {/* Quick Presets Dropdown */}
        <Tooltip title="Quick 12-Hour Presets">
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
            sx: { maxHeight: 260, width: 140, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }
          }}
        >
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
