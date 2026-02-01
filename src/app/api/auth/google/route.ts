/**
 * GET /api/auth/google
 *
 * Initiate Google OAuth flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  getGoogleAuthUrl,
  sanitizeRedirectUrl,
  OAUTH_STATE_COOKIE,
  OAUTH_REDIRECT_COOKIE,
  COOKIE_OPTIONS,
} from "@/lib/auth";

// ============================================================================
// Handler
// ============================================================================

export async function GET(request: NextRequest) {
  // Generate CSRF state
  const state = crypto.randomUUID();

  // Get redirect destination
  const redirectTo = sanitizeRedirectUrl(
    request.nextUrl.searchParams.get("redirect"),
    "/admin"
  );

  // Store state and redirect in cookies
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE.name, state, {
    ...COOKIE_OPTIONS,
    maxAge: OAUTH_STATE_COOKIE.maxAge,
  });

  cookieStore.set(OAUTH_REDIRECT_COOKIE.name, redirectTo, {
    ...COOKIE_OPTIONS,
    maxAge: OAUTH_REDIRECT_COOKIE.maxAge,
  });

  // Redirect to Google
  const authUrl = getGoogleAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
