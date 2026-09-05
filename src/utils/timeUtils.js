/**
 * Shazusoft HRMS Time Formatting Utility
 * Converts any time format (24-hour HH:mm:ss, HH:mm, ISO date, or 12-hour)
 * into standard 12-hour AM/PM format (e.g., "09:30 AM", "06:30 PM").
 */

export function formatTime12h(timeStr, includeSeconds = false) {
  if (!timeStr || timeStr === '--' || timeStr === '--:--' || timeStr === 'In Progress' || timeStr === 'null') {
    return timeStr || '--:--';
  }

  const trimmed = String(timeStr).trim();

  // If already in 12h format (e.g. "09:30:15 AM", "9:30 PM")
  if (/AM|PM/i.test(trimmed)) {
    if (!includeSeconds) {
      // Clean up e.g. "09:30:15 AM" -> "09:30 AM"
      return trimmed.replace(/^(\d{1,2}:\d{2}):\d{2}\s*(AM|PM)$/i, '$1 $2');
    }
    return trimmed;
  }

  // Matches 24-hour "HH:mm:ss" or "HH:mm"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12 AM
    const strHours = String(hours).padStart(2, '0');
    return includeSeconds && match[3]
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

export default formatTime12h;
