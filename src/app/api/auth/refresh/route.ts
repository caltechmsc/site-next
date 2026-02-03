/**
 * POST /api/auth/refresh
 *
 * Refresh access token using refresh token.
 */

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  COOKIE_OPTIONS,
} from "@/lib/auth/constants";
import type { AdminRole } from "@/lib/auth/types";

// ============================================================================
// Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get(REFRESH_TOKEN.name)?.value;

    if (!refreshToken) {
      return createErrorResponse("No refresh token", 401);
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return createErrorResponse("Invalid or expired refresh token", 401, true);
    }

    // Get user from database
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!admin) {
      return createErrorResponse("Account not found", 401, true);
    }

    // Generate new access token
    const accessToken = await signAccessToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as AdminRole,
    });

    // Set new access token cookie and return success
    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set(ACCESS_TOKEN.name, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return createErrorResponse("An unexpected error occurred", 500);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create error response, optionally clearing auth cookies.
 */
function createErrorResponse(
  message: string,
  status: number,
  clearCookies = false
): NextResponse {
  const response = NextResponse.json(
    { success: false, error: message },
    { status }
  );

  if (clearCookies) {
    response.cookies.delete(ACCESS_TOKEN.name);
    response.cookies.delete(REFRESH_TOKEN.name);
  }

  return response;
}
