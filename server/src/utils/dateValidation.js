/**
 * Server-Side Global Date Validation Utility for TripByGenie
 * Enforces business timezone: Asia/Kolkata (IST)
 */

const BUSINESS_TIMEZONE = 'Asia/Kolkata';

function getTodayIST() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

function getTomorrowIST() {
  const today = getTodayIST();
  const [y, m, d] = today.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().split('T')[0];
}

function isTodayOrFutureDate(dateStr) {
  if (!dateStr) return false;
  const cleanDate = String(dateStr).split('T')[0].trim();
  const today = getTodayIST();
  return cleanDate >= today;
}

function isValidDateRange(departureDate, returnDate) {
  if (!departureDate || !returnDate) return false;
  const dep = String(departureDate).split('T')[0].trim();
  const ret = String(returnDate).split('T')[0].trim();
  const today = getTodayIST();
  return dep >= today && ret >= dep;
}

module.exports = {
  BUSINESS_TIMEZONE,
  getTodayIST,
  getTomorrowIST,
  isTodayOrFutureDate,
  isValidDateRange
};
