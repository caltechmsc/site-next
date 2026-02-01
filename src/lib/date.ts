/**
 * Date Utilities
 *
 * Elegant, timezone-safe date handling for calendar dates.
 */

// ============================================================================
// Types
// ============================================================================

/** ISO date string format: YYYY-MM-DD */
export type DateString = string;

/** Date format options for display */
export type DateFormat =
  | "year" // "2024"
  | "short" // "Jan 2024"
  | "medium" // "Jan 15, 2024"
  | "long"; // "January 15, 2024"

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Extract year from an ISO date string.
 */
export function getYear(dateStr: DateString): number {
  return parseInt(dateStr.substring(0, 4), 10);
}

/**
 * Extract month from an ISO date string.
 */
export function getMonth(dateStr: DateString): number {
  return parseInt(dateStr.substring(5, 7), 10);
}

/**
 * Extract day from an ISO date string.
 */
export function getDay(dateStr: DateString): number {
  return parseInt(dateStr.substring(8, 10), 10);
}

// ============================================================================
// Formatting Functions
// ============================================================================

/** Month names for formatting */
const MONTH_NAMES_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: DateString, format: DateFormat): string {
  const year = getYear(dateStr);
  const month = getMonth(dateStr);
  const day = getDay(dateStr);

  switch (format) {
    case "year":
      return year.toString();

    case "short":
      return `${MONTH_NAMES_SHORT[month - 1]} ${year}`;

    case "medium":
      return `${MONTH_NAMES_SHORT[month - 1]} ${day}, ${year}`;

    case "long":
      return `${MONTH_NAMES_LONG[month - 1]} ${day}, ${year}`;

    default:
      return dateStr;
  }
}

/**
 * Format a date range as a tenure string.
 */
export function formatTenure(
  startDate: DateString,
  endDate: DateString | null
): string {
  const startYear = getYear(startDate);

  if (!endDate) {
    return `${startYear} - Present`;
  }

  const endYear = getYear(endDate);
  return startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Compare two date strings for sorting.
 */
export function compareDates(a: DateString, b: DateString): number {
  // ISO format strings can be compared lexicographically
  return a.localeCompare(b);
}

/**
 * Check if a date is before another date.
 */
export function isBefore(
  dateStr: DateString,
  compareToStr: DateString
): boolean {
  return compareDates(dateStr, compareToStr) < 0;
}

/**
 * Check if a date is after another date.
 */
export function isAfter(
  dateStr: DateString,
  compareToStr: DateString
): boolean {
  return compareDates(dateStr, compareToStr) > 0;
}

/**
 * Check if a date is within a year range.
 */
export function isInYear(dateStr: DateString, year: number): boolean {
  return getYear(dateStr) === year;
}

// ============================================================================
// Validation Functions
// ============================================================================

/** Regex for validating ISO date format */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate an ISO date string format.
 */
export function isValidDate(dateStr: string): dateStr is DateString {
  if (!ISO_DATE_REGEX.test(dateStr)) {
    return false;
  }

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(5, 7), 10);
  const day = parseInt(dateStr.substring(8, 10), 10);

  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }

  // Validate day (considering month length)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return false;
  }

  return true;
}

// ============================================================================
// Current Date Functions
// ============================================================================

/**
 * Get the current date as an ISO string.
 */
export function getCurrentDate(): DateString {
  const now = new Date();
  return toDateString(now);
}

/**
 * Get the current year.
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert a Date object to an ISO date string.
 */
export function toDateString(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Create a date string from year, month, and day components.
 */
export function createDateString(
  year: number,
  month: number,
  day: number
): DateString {
  const yearStr = year.toString();
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${yearStr}-${monthStr}-${dayStr}`;
}

/**
 * Create a date string for January 1st of a given year.
 */
export function startOfYear(year: number): DateString {
  return createDateString(year, 1, 1);
}

/**
 * Create a date string for December 31st of a given year.
 */
export function endOfYear(year: number): DateString {
  return createDateString(year, 12, 31);
}
