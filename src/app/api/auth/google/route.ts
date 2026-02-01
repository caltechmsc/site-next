/**
 * GET /api/auth/google
 *
 * Initiate Google OAuth flow.
 * Redirects user to Google's consent page.
 */

import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  getGoogleAuthUrl,
  sanitizeRedirectUrl,
  OAUTH_STATE_COOKIE,
  OAUTH_REDIRECT_COOKIE,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Validate and sanitize redirect URL
  const requestedRedirect = request.nextUrl.searchParams.get("redirect");
  const redirectTo = sanitizeRedirectUrl(requestedRedirect, "/admin");

  // Generate cryptographically random state for CSRF protection
  const state = randomBytes(32).toString("base64url");

  const authUrl = getGoogleAuthUrl(state);

  const response = NextResponse.redirect(authUrl);

  // Store state in HttpOnly cookie for verification in callback
  response.cookies.set(OAUTH_STATE_COOKIE.name, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_COOKIE.maxAge,
    path: "/",
  });

  // Store redirect target in separate cookie
  response.cookies.set(OAUTH_REDIRECT_COOKIE.name, redirectTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_REDIRECT_COOKIE.maxAge,
    path: "/",
  });

  return response;
}
