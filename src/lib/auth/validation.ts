/**
 * Authentication Validation Utilities
 *
 * Shared validation functions for auth-related operations.
 */

import { NextRequest, NextResponse } from "next/server";

import { OAUTH_STATE_COOKIE, OAUTH_REDIRECT_COOKIE } from "./constants";

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

// ============================================================================
// OAuth Error Responses
// ============================================================================

/**
 * Create an error redirect response for OAuth flows.
 * Redirects to login page with error parameter and clears OAuth cookies.
 */
export function createOAuthErrorRedirect(
  request: NextRequest,
  errorCode: string
): NextResponse {
  const errorUrl = new URL("/admin/login", request.url);
  errorUrl.searchParams.set("error", errorCode);

  const response = NextResponse.redirect(errorUrl);

  // Clear OAuth state cookies to prevent reuse
  response.cookies.delete(OAUTH_STATE_COOKIE.name);
  response.cookies.delete(OAUTH_REDIRECT_COOKIE.name);

  return response;
}
