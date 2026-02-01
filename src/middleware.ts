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

  // Protected routes: check authentication
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
