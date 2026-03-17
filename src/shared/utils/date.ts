/**
 * Date Utility Functions using date-fns
 *
 * Handles date formatting for API communication
 * IMPORTANT: API date parameters use YYYY-MM-DD format only
 * Frontend sends: "2025-01-15" (date-only format)
 * Backend stores: Full timestamps internally
 * Frontend displays: Converts to user's local timezone
 */

import {
  parseISO,
  format,
  isToday as isTodayFns,
  isYesterday as isYesterdayFns,
  isTomorrow as isTomorrowFns,
  startOfDay,
} from 'date-fns';

/**
 * Convert a local Date object to YYYY-MM-DD format
 * Used when sending dates to the API as query parameters
 *
 * @param date - Local Date object (e.g., user selects Jan 15, 2025)
 * @returns Date string in YYYY-MM-DD format (e.g., "2025-01-15")
 *
 * @example
 * const localDate = new Date(2025, 0, 15)
 * toUTCDateString(localDate) // "2025-01-15"
 */
export function toUTCDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get today's date in YYYY-MM-DD format
 * Used for creating journal entries for "today"
 *
 * @returns Date string in YYYY-MM-DD format (e.g., "2025-01-15")
 *
 * @example
 * getTodayUTC() // "2025-01-15"
 */
export function getTodayUTC(): string {
  return toUTCDateString(new Date());
}

/**
 * Format a date for display in the user's locale
 *
 * @param date - Date to format (can be Date object or UTC ISO string)
 * @param formatPattern - date-fns format pattern (default: 'PPPP' - full date)
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date(2025, 0, 15)) // "Wednesday, January 15th, 2025"
 * formatDate("2025-01-15T00:00:00.000Z", 'PP') // "Jan 15, 2025"
 */
export function formatDate(date: Date | string, formatPattern: string = 'PPPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatPattern);
}

/**
 * Check if a date is today
 *
 * @param date - Date to check (can be Date object or UTC ISO string)
 * @returns True if the date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isTodayFns(dateObj);
}

/**
 * Check if a date is yesterday
 *
 * @param date - Date to check (can be Date object or UTC ISO string)
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isYesterdayFns(dateObj);
}

/**
 * Check if a date is tomorrow
 *
 * @param date - Date to check (can be Date object or UTC ISO string)
 * @returns True if the date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isTomorrowFns(dateObj);
}

/**
 * Check if a date is in the past (before today)
 *
 * @param date - Date to check (can be Date object or UTC ISO string)
 * @returns True if the date is before today
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = startOfDay(new Date());
  const compareDate = startOfDay(dateObj);
  // Compare start of day for both dates to ignore time component
  return compareDate < today;
}

/**
 * Convert a YYYY-MM-DD date string to ISO 8601 UTC format
 * Used when sending dates to API endpoints that require full ISO format
 *
 * @param dateString - Date string in YYYY-MM-DD format (e.g., "2025-01-15")
 * @returns ISO 8601 UTC string (e.g., "2025-01-15T00:00:00.000Z")
 *
 * @example
 * toISODateString("2025-01-15") // "2025-01-15T00:00:00.000Z"
 */
export function toISODateString(dateString: string): string {
  return `${dateString}T00:00:00.000Z`;
}

/**
 * Extract YYYY-MM-DD date portion from an ISO 8601 date string
 * Used for query key invalidation when the DTO contains ISO format dates
 *
 * @param isoDateString - ISO 8601 date string (e.g., "2025-01-15T00:00:00.000Z") or YYYY-MM-DD
 * @returns Date string in YYYY-MM-DD format (e.g., "2025-01-15")
 *
 * @example
 * fromISOToDateString("2025-01-15T00:00:00.000Z") // "2025-01-15"
 * fromISOToDateString("2025-01-15") // "2025-01-15"
 */
export function fromISOToDateString(isoDateString: string): string {
  return isoDateString.split('T')[0];
}
