/**
 * Next.js Middleware
 *
 * Handles authentication for protected routes.
 * Runs on Edge Runtime before every matched request.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  checkAuthStatus,
  requiresAuth,
  isPublicApiRoute,
  isAuthPage,
  isAuthenticated,
} from "@/lib/auth/middleware";
import { sanitizeRedirectUrl } from "@/lib/auth/validation";

// ============================================================================
// Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public API routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Auth pages: redirect authenticated users to admin dashboard
  if (isAuthPage(pathname)) {
    if (await isAuthenticated(request)) {
      let redirectTo = sanitizeRedirectUrl(
        request.nextUrl.searchParams.get("redirect"),
        "/admin"
      );
      if (isAuthPage(redirectTo)) {
        redirectTo = "/admin";
      }
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.next();
  }

  // Non-protected routes: allow through
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  // Protected routes: check if user has any valid token
  const result = await checkAuthStatus(request);

  // Valid access token, allow through
  if (result.status === "valid") {
    return NextResponse.next();
  }

  // Both tokens invalid, redirect to login
  return NextResponse.redirect(result.loginUrl);
}

// ============================================================================
// Config
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - `_next/static` (static files)
     * - `_next/image` (image optimization)
     * - `favicon.ico`
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
