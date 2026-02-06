/**
 * Authentication Middleware Utilities
 *
 * Edge-compatible functions for Next.js middleware.
 * Only checks access token - refresh is handled client-side.
 */

import { NextRequest } from "next/server";

import { verifyAccessToken } from "@/lib/auth/jwt";
import { ACCESS_TOKEN } from "@/lib/auth/constants";

// ============================================================================
// Auth Check
// ============================================================================

/**
 * Check if request has valid access token.
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

/**
 * Build login URL with redirect parameter.
 */
export function buildLoginUrl(baseUrl: string, redirectPath: string): string {
  const url = new URL("/admin/login", baseUrl);
  if (redirectPath && !isAuthPage(redirectPath)) {
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
 * Check if path is an authentication page.
 */
export function isAuthPage(pathname: string): boolean {
  return pathname.startsWith("/admin/login");
}

/**
 * Check if path is a public API route (no auth required).
 */
export function isPublicApiRoute(pathname: string): boolean {
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/google",
    "/api/auth/refresh",
  ];
  return publicRoutes.some((route) => pathname.startsWith(route));
}
