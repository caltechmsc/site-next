/**
 * Cookie Management for Authentication
 *
 * Handles auth cookies with proper security options.
 * All cookies are HttpOnly to prevent XSS attacks.
 */

import { cookies } from "next/headers";

import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  COOKIE_OPTIONS,
} from "@/lib/auth/constants";

// ============================================================================
// Set Cookies
// ============================================================================

/**
 * Set both access and refresh token cookies.
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN.name, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN.maxAge,
  });

  cookieStore.set(REFRESH_TOKEN.name, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN.maxAge,
  });
}

/**
 * Set only access token cookie (used during refresh).
 */
export async function setAccessCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN.name, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN.maxAge,
  });
}

// ============================================================================
// Get Cookies
// ============================================================================

/**
 * Get access token from cookies.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN.name)?.value;
}

/**
 * Get refresh token from cookies.
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN.name)?.value;
}

// ============================================================================
// Clear Cookies
// ============================================================================

/**
 * Clear all auth cookies (logout).
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN.name);
  cookieStore.delete(REFRESH_TOKEN.name);
}
