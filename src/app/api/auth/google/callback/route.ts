/**
 * GET /api/auth/google/callback
 *
 * Handle Google OAuth callback.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  exchangeCodeForToken,
  getGoogleUserInfo,
  loginWithGoogle,
  sanitizeRedirectUrl,
  OAUTH_STATE_COOKIE,
  OAUTH_REDIRECT_COOKIE,
} from "@/lib/auth";

// ============================================================================
// Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors from Google
  if (error) {
    return redirectWithError(request, "oauth_denied");
  }

  // Validate authorization code
  if (!code) {
    return redirectWithError(request, "missing_code");
  }

  // CSRF Protection: Validate state
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE.name)?.value;
  if (!state || !storedState || state !== storedState) {
    return redirectWithError(request, "invalid_state");
  }

  // Get redirect URL from cookie
  const storedRedirect = request.cookies.get(OAUTH_REDIRECT_COOKIE.name)?.value;
  const redirectTo = sanitizeRedirectUrl(storedRedirect, "/admin");

  try {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

    if (!googleUser.email_verified) {
      return redirectWithError(request, "email_not_verified");
    }

    // Attempt login
    const result = await loginWithGoogle(googleUser.email);

    if (!result.success) {
      return redirectWithError(request, "not_authorized");
    }

    // Success - redirect to destination
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    clearOAuthCookies(response);
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return redirectWithError(request, "oauth_failed");
  }
}

// ============================================================================
// Helpers
// ============================================================================

function redirectWithError(
  request: NextRequest,
  errorCode: string
): NextResponse {
  const errorUrl = new URL("/admin/login", request.url);
  errorUrl.searchParams.set("error", errorCode);

  const response = NextResponse.redirect(errorUrl);
  clearOAuthCookies(response);
  return response;
}

function clearOAuthCookies(response: NextResponse): void {
  response.cookies.delete(OAUTH_STATE_COOKIE.name);
  response.cookies.delete(OAUTH_REDIRECT_COOKIE.name);
}
