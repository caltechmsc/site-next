/**
 * Authentication Validation Utilities
 *
 * Shared validation functions for auth-related operations.
 */

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validate that a redirect URL is safe for internal redirects.
 */
export function isValidRedirectUrl(url: string): boolean {
  // Must start with / and not be a protocol-relative URL
  if (!url.startsWith("/") || url.startsWith("//")) {
    return false;
  }

  // Reject URLs with newlines (HTTP header injection)
  if (url.includes("\n") || url.includes("\r")) {
    return false;
  }

  return true;
}

/**
 * Sanitize and validate a redirect URL, returning a safe default if invalid.
 */
export function sanitizeRedirectUrl(
  requestedUrl: string | null | undefined,
  defaultUrl = "/admin"
): string {
  if (!requestedUrl) {
    return defaultUrl;
  }

  return isValidRedirectUrl(requestedUrl) ? requestedUrl : defaultUrl;
}
