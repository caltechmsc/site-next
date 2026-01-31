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
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Parse redirect URL from state
  let redirectTo = "/admin";
  if (state) {
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf-8")
      );
      redirectTo = decoded.redirectTo || "/admin";
    } catch {
      // Ignore invalid state
    }
  }

  // Handle OAuth errors
  if (error) {
    const errorUrl = new URL("/admin/login", request.url);
    errorUrl.searchParams.set("error", "oauth_denied");
    return NextResponse.redirect(errorUrl);
  }

  // Validate code
  if (!code) {
    const errorUrl = new URL("/admin/login", request.url);
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

    if (!googleUser.email_verified) {
      const errorUrl = new URL("/admin/login", request.url);
      errorUrl.searchParams.set("error", "email_not_verified");
      return NextResponse.redirect(errorUrl);
    }

    // Attempt login (user must be pre-registered as admin)
    const result = await loginWithGoogle(googleUser.email, googleUser.name);

    if (!result.success) {
      const errorUrl = new URL("/admin/login", request.url);
      errorUrl.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(errorUrl);
    }

    // Success - redirect to admin dashboard
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const errorUrl = new URL("/admin/login", request.url);
    errorUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(errorUrl);
  }
}
