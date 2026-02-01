/**
 * Authentication Constants
 *
 * Centralized configuration for JWT tokens, cookies, and OAuth.
 */

import { env, siteConfig } from "@/config";

// ============================================================================
// Token Configuration
// ============================================================================

/**
 * Access Token: Short-lived, contains user identity.
 */
export const ACCESS_TOKEN = {
  name: "msc_access",
  maxAge: 15 * 60, // 15 minutes
  algorithm: "HS256" as const,
} as const;

/**
 * Refresh Token: Long-lived, contains only user ID.
 */
export const REFRESH_TOKEN = {
  name: "msc_refresh",
  maxAge: 7 * 24 * 60 * 60, // 7 days
  algorithm: "HS256" as const,
} as const;

// ============================================================================
// JWT Secret
// ============================================================================

export const JWT_SECRET = env.JWT_SECRET;

// ============================================================================
// Cookie Configuration
// ============================================================================

/**
 * Shared cookie options for security.
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
} as const;

// ============================================================================
// OAuth Cookies
// ============================================================================

export const OAUTH_STATE_COOKIE = {
  name: "msc_oauth_state",
  maxAge: 10 * 60, // 10 minutes
} as const;

export const OAUTH_REDIRECT_COOKIE = {
  name: "msc_oauth_redirect",
  maxAge: 10 * 60, // 10 minutes
} as const;

// ============================================================================
// Google OAuth Configuration
// ============================================================================

export const GOOGLE_OAUTH = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${siteConfig.url}/api/auth/google/callback`,
  scopes: ["openid", "email", "profile"],
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
} as const;
