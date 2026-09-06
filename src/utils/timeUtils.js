/**
 * Shazusoft HRMS Time Formatting & Conversion Utility
 * Converts any time format (24-hour HH:mm:ss, HH:mm, ISO date, or 12-hour AM/PM)
 * into standard 12-hour AM/PM format (e.g., "09:30 AM", "06:30 PM") and 24-hour ("HH:mm") format.
 */

/**
 * Formats any time string into standard 12-hour format "09:30 AM" or "09:30:15 AM"
 */
export function formatTime12h(timeStr, includeSeconds = false) {
  if (!timeStr || timeStr === '--' || timeStr === '--:--' || timeStr === 'In Progress' || timeStr === 'null' || timeStr === 'undefined') {
    return timeStr || '--:--';
  }

  const trimmed = String(timeStr).trim();

  // If already in 12h format (e.g. "09:30:15 AM", "9:30 AM", "6:45 PM")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    const hours = String(parseInt(ampmMatch[1], 10)).padStart(2, '0');
    const minutes = ampmMatch[2];
    const seconds = ampmMatch[3] || '00';
    const ampm = ampmMatch[4].toUpperCase();
    return includeSeconds && ampmMatch[3]
      ? `${hours}:${minutes}:${seconds} ${ampm}`
      : `${hours}:${minutes} ${ampm}`;
  }

  // Matches 24-hour "HH:mm:ss" or "HH:mm"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    const seconds = match24[3] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12 AM
    const strHours = String(hours).padStart(2, '0');
    return includeSeconds && match24[3]
      ? `${strHours}:${minutes}:${seconds} ${ampm}`
      : `${strHours}:${minutes} ${ampm}`;
  }

  // Try parsing ISO date string
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');
      return includeSeconds
        ? `${strHours}:${minutes}:${seconds} ${ampm}`
        : `${strHours}:${minutes} ${ampm}`;
    }
  } catch (e) {}

  return trimmed;
}

/**
 * Converts any time string (12-hour or 24-hour) to 24-hour "HH:mm" format for <input type="time">
 */
export function timeTo24h(timeStr, defaultFallback = '09:30') {
  if (!timeStr || timeStr === '--' || timeStr === '--:--' || timeStr === 'In Progress' || timeStr === 'null' || timeStr === 'undefined') {
    return defaultFallback;
  }

  const trimmed = String(timeStr).trim();

  // If already 24-hour "HH:mm" or "HH:mm:ss"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24 && !/AM|PM/i.test(trimmed)) {
    const h = String(parseInt(match24[1], 10)).padStart(2, '0');
    return `${h}:${match24[2]}`;
  }

  // 12-hour format "06:30 PM", "9:30 AM", "6:45:00 PM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // Try parsing ISO date string
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  } catch (e) {}

  return defaultFallback;
}

export default formatTime12h;
