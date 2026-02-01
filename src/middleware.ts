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
} from "@/lib/auth/middleware";

// ============================================================================
// Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public API routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  // Check auth status
  const result = await checkAuthStatus(request);

  switch (result.status) {
    case "authenticated":
      return NextResponse.next();

    case "needs-refresh":
      return NextResponse.redirect(result.refreshUrl);

    case "unauthenticated":
      return NextResponse.redirect(result.loginUrl);
  }
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
