/**
 * URL Validation Utilities
 *
 * Security utilities for validating redirect URLs.
 */

/**
 * Check if a URL is safe for redirect (same origin).
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Must start with / (relative path)
  if (!url.startsWith("/")) return false;

  // Must not be a protocol-relative URL
  if (url.startsWith("//")) return false;

  return true;
}

/**
 * Sanitize redirect URL, returning default if invalid.
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  defaultUrl: string
): string {
  return isValidRedirectUrl(url) ? url! : defaultUrl;
}
