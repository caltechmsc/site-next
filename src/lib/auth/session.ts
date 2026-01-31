/**
 * Session Management
 *
 * High-level functions for authentication flow.
 * Combines JWT, cookies, and database operations.
 */

import { prisma } from "@/lib/db/client";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  signAccessToken,
} from "@/lib/auth/jwt";
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  setAccessCookie,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { type AdminRole } from "@/lib/auth/constants";

// ============================================================================
// Types
// ============================================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export type AuthResult =
  | { success: true; user: SessionUser }
  | { success: false; error: string };

// ============================================================================
// Get Current Session
// ============================================================================

/**
 * Get the current authenticated user from session.
 *
 * Flow:
 * 1. Try to verify access token
 * 2. If expired, try to refresh using refresh token
 * 3. If refresh fails, return null (user must re-login)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Step 1: Try access token
  const accessToken = await getAccessToken();
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    }
  }

  // Step 2: Access token invalid/expired, try refresh
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const refreshPayload = await verifyRefreshToken(refreshToken);
  if (!refreshPayload) {
    // Refresh token also invalid, clear cookies
    await clearAuthCookies();
    return null;
  }

  // Step 3: Refresh token valid, verify user still exists in DB
  const admin = await prisma.admin.findUnique({
    where: { id: refreshPayload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!admin) {
    // User was deleted, clear cookies
    await clearAuthCookies();
    return null;
  }

  // Step 4: Issue new access token
  const newAccessToken = await signAccessToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as AdminRole,
  });

  await setAccessCookie(newAccessToken);

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as AdminRole,
  };
}

// ============================================================================
// Password Login
// ============================================================================

/**
 * Authenticate with email and password.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  // Find admin by email
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin) {
    return { success: false, error: "Invalid email or password" };
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokenPair({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as AdminRole,
  });

  // Set cookies
  await setAuthCookies(accessToken, refreshToken);

  return {
    success: true,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as AdminRole,
    },
  };
}

// ============================================================================
// Google OAuth Login
// ============================================================================

/**
 * Authenticate with Google OAuth.
 * User must already be registered as an admin.
 */
export async function loginWithGoogle(
  googleEmail: string,
  googleName: string
): Promise<AuthResult> {
  // Find admin by Google email
  const admin = await prisma.admin.findUnique({
    where: { email: googleEmail.toLowerCase() },
  });

  if (!admin) {
    return {
      success: false,
      error: "This Google account is not authorized as an administrator",
    };
  }

  // Update name if changed
  if (admin.name !== googleName) {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { name: googleName },
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokenPair({
    id: admin.id,
    email: admin.email,
    name: googleName,
    role: admin.role as AdminRole,
  });

  // Set cookies
  await setAuthCookies(accessToken, refreshToken);

  return {
    success: true,
    user: {
      id: admin.id,
      email: admin.email,
      name: googleName,
      role: admin.role as AdminRole,
    },
  };
}

// ============================================================================
// Logout
// ============================================================================

/**
 * Clear all auth cookies (logout).
 */
export async function logout(): Promise<void> {
  await clearAuthCookies();
}

// ============================================================================
// Require Auth (for API routes)
// ============================================================================

/**
 * Get current user or throw if not authenticated.
 * Use in API routes that require authentication.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Check if user has required role.
 */
export function hasRole(
  user: SessionUser,
  requiredRoles: AdminRole[]
): boolean {
  return requiredRoles.includes(user.role);
}
