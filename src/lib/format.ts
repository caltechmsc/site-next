/**
 * Format Utilities
 *
 * Common formatting functions used across the application.
 */

// ============================================================================
// Name & Text Formatting
// ============================================================================

/**
 * Extract initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ============================================================================
// Date & Time Formatting
// ============================================================================

/**
 * Format a date range as a tenure string.
 */
export function formatTenure(startDate: Date, endDate: Date | null): string {
  const startYear = new Date(startDate).getFullYear();
  if (!endDate) {
    return `${startYear} - Present`;
  }
  const endYear = new Date(endDate).getFullYear();
  return startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format large numbers with K/M suffixes.
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// ============================================================================
// JSON Parsing Utilities
// ============================================================================

/**
 * Parse authors from JSON string or plain string.
 * Handles both JSON array format and plain comma-separated strings.
 */
export function parseAuthors(authorsJson: string): string[] {
  try {
    const parsed = JSON.parse(authorsJson);
    return Array.isArray(parsed) ? parsed : [authorsJson];
  } catch {
    return [authorsJson];
  }
}

/**
 * Join authors for display with "et al." truncation.
 */
export function joinAuthors(authors: string[], maxDisplay: number = 5): string {
  if (authors.length > maxDisplay) {
    return `${authors.slice(0, maxDisplay).join(", ")}, et al.`;
  }
  return authors.join(", ");
}

// ============================================================================
// Text Truncation
// ============================================================================

/**
 * Truncate text at word boundaries.
 * Ensures text is cut at a space rather than mid-word.
 */
export function truncateAtWordBoundary(
  text: string,
  maxLength: number
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  // If no space found, just truncate at maxLength
  if (lastSpace === -1) {
    return truncated;
  }

  return truncated.slice(0, lastSpace);
}
