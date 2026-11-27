/**
 * Global Date Validation Utility for TripByGenie
 * Enforces business timezone: Asia/Kolkata (IST)
 */

export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata (IST).
 */
export function getTodayIST(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD in Asia/Kolkata (IST).
 */
export function getTomorrowIST(): string {
  const today = getTodayIST();
  const [y, m, d] = today.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().split('T')[0];
}

/**
 * Checks if a given date string (YYYY-MM-DD) is today or in the future in Asia/Kolkata.
 */
export function isTodayOrFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const cleanDate = dateStr.split('T')[0].trim();
  const today = getTodayIST();
  return cleanDate >= today;
}

/**
 * Checks if a return/end date is valid relative to departure/start date.
 * Both must be today or future, and returnDate >= departureDate.
 */
export function isValidDateRange(departureDate: string, returnDate: string): boolean {
  if (!departureDate || !returnDate) return false;
  const dep = departureDate.split('T')[0].trim();
  const ret = returnDate.split('T')[0].trim();
  const today = getTodayIST();
  return dep >= today && ret >= dep;
}
