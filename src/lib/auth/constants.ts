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
 * Access Token: Short-lived, used for API authorization.
 * No database lookup required during validation.
 */
export const ACCESS_TOKEN = {
  name: "msc_access",
  maxAge: 15 * 60, // 15 minutes in seconds
  algorithm: "HS256" as const,
} as const;

/**
 * Refresh Token: Long-lived, used to obtain new access tokens.
 * Database lookup required during refresh to verify user still exists.
 */
export const REFRESH_TOKEN = {
  name: "msc_refresh",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  algorithm: "HS256" as const,
} as const;

// ============================================================================
// JWT Secret
// ============================================================================

/**
 * JWT signing secret from environment.
 */
export const JWT_SECRET = env.JWT_SECRET;

// ============================================================================
// Cookie Configuration
// ============================================================================

/**
 * Shared cookie options for security.
 * HttpOnly prevents XSS, Secure ensures HTTPS in production.
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
} as const;

// ============================================================================
// OAuth State Cookies
// ============================================================================

/**
 * OAuth state cookie for CSRF protection.
 * Contains cryptographically random value validated in callback.
 */
export const OAUTH_STATE_COOKIE = {
  name: "msc_oauth_state",
  maxAge: 10 * 60, // 10 minutes in seconds
} as const;

/**
 * OAuth redirect cookie.
 * Stores intended redirect destination after successful OAuth.
 */
export const OAUTH_REDIRECT_COOKIE = {
  name: "msc_oauth_redirect",
  maxAge: 10 * 60, // 10 minutes in seconds
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

// ============================================================================
// Admin Roles
// ============================================================================

export const ADMIN_ROLES = {
  ADMIN: "admin", // Full access to all content
  EDITOR: "editor", // Can edit content, but not admins
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];
