// Trips are entered as month + year + number of days (exact dates aren't needed).

/** "March 2025" (read in UTC so it never slips to the previous month) */
export function monthYear(d: string | Date | null | undefined): string {
  if (!d) return '';
  const t = new Date(d);
  if (isNaN(t.getTime())) return '';
  return t.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** The trip's length from its stored start and end (start + days − 1), or 0 */
export function daysFromDates(start: string | Date | null | undefined, end: string | Date | null | undefined): number {
  if (!start || !end) return 0;
  const d = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return d > 0 && d < 400 ? d : 0;
}
