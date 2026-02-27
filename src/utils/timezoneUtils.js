/**
 * Validate an IANA timezone string
 * @param {string} tz - IANA timezone (e.g., 'Asia/Kolkata')
 * @returns {boolean}
 */
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a local date+time in a given IANA timezone to UTC
 * Uses the Intl offset trick without external dependencies.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:mm'
 * @param {string} timezone - IANA timezone string
 * @returns {Date} UTC Date
 */
function localToUTC(dateStr, timeStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Create initial UTC guess treating the input as UTC
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Format that UTC guess into the target timezone to find what local time it represents
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(utcGuess);

  const p = {};
  parts.forEach(({ type, value }) => { p[type] = value; });

  // Handle midnight edge case where hour becomes '24'
  const tzHour = p.hour === '24' ? 0 : parseInt(p.hour, 10);
  const tzDate = new Date(Date.UTC(
    parseInt(p.year, 10),
    parseInt(p.month, 10) - 1,
    parseInt(p.day, 10),
    tzHour,
    parseInt(p.minute, 10),
    parseInt(p.second, 10)
  ));

  // diffMs = timezone's local time - utcGuess = timezone offset in ms
  const diffMs = tzDate - utcGuess;

  // Actual UTC = our local time (as UTC) minus the offset
  return new Date(utcGuess.getTime() - diffMs);
}

/**
 * Detect overlapping sessions using UTC timestamps.
 * All sessions must share the same timezone (workshop-level field).
 *
 * @param {Array} sessions - Array of session objects { date, startTime, endTime }
 * @param {string} timezone - IANA timezone string
 * @returns {{ hasConflict: boolean, conflictDetails: string|null }}
 */
function detectSessionConflicts(sessions, timezone) {
  // Build UTC intervals
  const intervals = sessions.map((s, i) => {
    const dateStr = s.date instanceof Date
      ? s.date.toISOString().slice(0, 10)
      : s.date;

    return {
      index: i,
      startUTC: localToUTC(dateStr, s.startTime, timezone),
      endUTC: localToUTC(dateStr, s.endTime, timezone)
    };
  });

  // Sort by start time
  intervals.sort((a, b) => a.startUTC - b.startUTC);

  for (let i = 1; i < intervals.length; i++) {
    const prev = intervals[i - 1];
    const curr = intervals[i];

    if (curr.startUTC < prev.endUTC) {
      return {
        hasConflict: true,
        conflictDetails: `Session ${prev.index + 1} and session ${curr.index + 1} have overlapping times`
      };
    }
  }

  return { hasConflict: false, conflictDetails: null };
}

module.exports = { isValidTimezone, localToUTC, detectSessionConflicts };
