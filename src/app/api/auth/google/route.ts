/**
 * GET /api/auth/google
 *
 * Initiate Google OAuth flow.
 * Redirects user to Google's consent page.
 */

import { NextRequest, NextResponse } from "next/server";

import { getGoogleAuthUrl } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Optional: store redirect URL in state
  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/admin";

  // Generate state to prevent CSRF
  const state = Buffer.from(JSON.stringify({ redirectTo })).toString(
    "base64url"
  );

  const authUrl = getGoogleAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
