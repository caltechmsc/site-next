/**
 * Authentication Middleware Utilities
 *
 * Edge-compatible functions for Next.js middleware.
 * NO database access (Edge Runtime limitation).
 * NO cookie writing (delegated to refresh API).
 */

import { NextRequest } from "next/server";

import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/lib/auth/constants";
import type { AuthCheckResult } from "@/lib/auth/types";

// ============================================================================
// Auth Check
// ============================================================================

/**
 * Check authentication status for middleware.
 *
 * Returns action to take:
 * - authenticated: Access token valid, proceed
 * - needs-refresh: Access expired but refresh valid, redirect to refresh API
 * - unauthenticated: Both invalid, redirect to login
 */
export async function checkAuthStatus(
  request: NextRequest
): Promise<AuthCheckResult> {
  const accessToken = request.cookies.get(ACCESS_TOKEN.name)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN.name)?.value;
  const currentPath = request.nextUrl.pathname + request.nextUrl.search;

  // 1. Try access token (fast path)
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      return { status: "authenticated" };
    }
  }

  // 2. Access invalid/expired, try refresh token
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      const refreshUrl = buildRefreshUrl(request.url, currentPath);
      return { status: "needs-refresh", refreshUrl };
    }
  }

  // 3. Both invalid, redirect to login
  const loginUrl = buildLoginUrl(request.url, currentPath);
  return { status: "unauthenticated", loginUrl };
}

/**
 * Quick check if user has valid access token.
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const accessToken = request.cookies.get(ACCESS_TOKEN.name)?.value;
  if (!accessToken) return false;

  const payload = await verifyAccessToken(accessToken);
  return payload !== null;
}

// ============================================================================
// URL Builders
// ============================================================================

function buildRefreshUrl(baseUrl: string, redirectPath: string): string {
  const url = new URL("/api/auth/refresh", baseUrl);
  url.searchParams.set("redirect", redirectPath);
  return url.toString();
}

function buildLoginUrl(baseUrl: string, redirectPath: string): string {
  const url = new URL("/admin/login", baseUrl);
  if (redirectPath !== "/admin/login") {
    url.searchParams.set("redirect", redirectPath);
  }
  return url.toString();
}

// ============================================================================
// Route Matchers
// ============================================================================

/**
 * Check if path requires authentication.
 */
export function requiresAuth(pathname: string): boolean {
  return pathname.startsWith("/admin") && !isAuthPage(pathname);
}

/**
 * Check if path is an authentication page (login, etc.).
 */
export function isAuthPage(pathname: string): boolean {
  return pathname.startsWith("/admin/login");
}

/**
 * Check if path is a public API route.
 */
export function isPublicApiRoute(pathname: string): boolean {
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/refresh",
    "/api/auth/google",
  ];
  return publicRoutes.some((route) => pathname.startsWith(route));
}
