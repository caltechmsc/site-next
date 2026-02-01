/**
 * GET /api/auth/google/callback
 *
 * Handle Google OAuth callback.
 * Exchange code for token, verify user, set auth cookies.
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

/**
 * Clear OAuth cookies to prevent reuse.
 */
function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(OAUTH_STATE_COOKIE.name);
  response.cookies.delete(OAUTH_REDIRECT_COOKIE.name);
}

/**
 * Create an error redirect response for OAuth flows.
 * Redirects to login page with error parameter and clears OAuth cookies.
 */
function createOAuthErrorRedirect(
  request: NextRequest,
  errorCode: string
): NextResponse {
  const errorUrl = new URL("/admin/login", request.url);
  errorUrl.searchParams.set("error", errorCode);

  const response = NextResponse.redirect(errorUrl);

  clearOAuthCookies(response);

  return response;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors from Google
  if (error) {
    return createOAuthErrorRedirect(request, "oauth_denied");
  }

  // Validate authorization code
  if (!code) {
    return createOAuthErrorRedirect(request, "missing_code");
  }

  // CSRF Protection: Validate state against stored cookie
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE.name)?.value;
  if (!state || !storedState || state !== storedState) {
    return createOAuthErrorRedirect(request, "invalid_state");
  }

  // Get redirect URL from cookie, with validation
  const storedRedirect = request.cookies.get(OAUTH_REDIRECT_COOKIE.name)?.value;
  const redirectTo = sanitizeRedirectUrl(storedRedirect, "/admin");

  try {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

    if (!googleUser.email_verified) {
      return createOAuthErrorRedirect(request, "email_not_verified");
    }

    // Attempt login (user must be pre-registered as admin)
    const result = await loginWithGoogle(googleUser.email, googleUser.name);

    if (!result.success) {
      return createOAuthErrorRedirect(request, "not_authorized");
    }

    // Success - redirect to admin dashboard
    const successResponse = NextResponse.redirect(
      new URL(redirectTo, request.url)
    );
    clearOAuthCookies(successResponse);
    return successResponse;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return createOAuthErrorRedirect(request, "oauth_failed");
  }
}
