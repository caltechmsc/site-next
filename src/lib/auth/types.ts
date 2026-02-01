/**
 * Authentication Types
 *
 * Centralized type definitions for the auth module.
 */

import type { JWTPayload } from "jose";

// ============================================================================
// Admin Roles
// ============================================================================

export const ADMIN_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

// ============================================================================
// JWT Payloads
// ============================================================================

/**
 * Access Token payload.
 * Contains full user identity for quick authorization.
 */
export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  type: "access";
}

/**
 * Refresh Token payload.
 * Minimal data - user info fetched from DB during refresh.
 */
export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  type: "refresh";
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Authenticated user information.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * Authentication result for login operations.
 */
export type AuthResult =
  | { success: true; user: SessionUser }
  | { success: false; error: string };

// ============================================================================
// Middleware Types
// ============================================================================

/**
 * Result of authentication check in middleware.
 */
export type AuthCheckResult =
  | { status: "authenticated" }
  | { status: "needs-refresh"; refreshUrl: string }
  | { status: "unauthenticated"; loginUrl: string };

// ============================================================================
// Google OAuth Types
// ============================================================================

/**
 * Google user info from OAuth API.
 */
export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}
