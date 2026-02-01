/**
 * GET /api/auth/refresh
 *
 * Refresh access token using refresh token.
 * Called by middleware when access token expires.
 */

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import {
  verifyRefreshToken,
  signAccessToken,
  getRefreshToken,
  setAccessCookie,
  clearAuthCookies,
  sanitizeRedirectUrl,
  type AdminRole,
} from "@/lib/auth";

// ============================================================================
// Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const redirectTo = sanitizeRedirectUrl(
    request.nextUrl.searchParams.get("redirect"),
    "/admin"
  );

  try {
    // 1. Get and verify refresh token
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return redirectToLogin(request, redirectTo, "session_expired");
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      await clearAuthCookies();
      return redirectToLogin(request, redirectTo, "session_expired");
    }

    // 2. Verify user exists and get latest info from DB
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!admin) {
      await clearAuthCookies();
      return redirectToLogin(request, redirectTo, "account_deleted");
    }

    // 3. Generate new access token with latest user info
    const newAccessToken = await signAccessToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as AdminRole,
    });

    // 4. Set cookie and redirect back
    await setAccessCookie(newAccessToken);

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("Refresh error:", error);
    return redirectToLogin(request, redirectTo, "refresh_failed");
  }
}

// ============================================================================
// Helpers
// ============================================================================

function redirectToLogin(
  request: NextRequest,
  originalRedirect: string,
  errorCode: string
): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("error", errorCode);
  if (originalRedirect !== "/admin/login") {
    loginUrl.searchParams.set("redirect", originalRedirect);
  }
  return NextResponse.redirect(loginUrl);
}
