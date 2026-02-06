/**
 * Next.js Middleware
 *
 * Protect admin routes and handle authentication redirects.
 * Only checks access token; refresh handled client-side.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  isAuthenticated,
  buildLoginUrl,
  requiresAuth,
  isPublicApiRoute,
  isAuthPage,
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

  // Protected routes: check access token
  if (await isAuthenticated(request)) {
    return NextResponse.next();
  }

  // Not authenticated: redirect to login
  const currentPath = pathname + request.nextUrl.search;
  const loginUrl = buildLoginUrl(request.url, currentPath);
  return NextResponse.redirect(loginUrl);
}

// ============================================================================
// Config
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
