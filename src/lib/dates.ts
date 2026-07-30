// The month runs 2026-05-11 (Mon) through 2026-06-07 (Sun).
export const DEFAULT_DATE = '2026-05-11';

// Noon avoids timezone edge cases shifting the calendar day.
function atNoon(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

/** "Monday, May 11" */
export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(atNoon(date));
}

/** "May 11" */
export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(atNoon(date));
}

/** 14 -> "2pm", 6 -> "6am" */
export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? 'am' : 'pm'}`;
}
