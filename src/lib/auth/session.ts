/**
 * Session Management
 *
 * High-level authentication functions.
 *
 * READ-ONLY functions: Safe for Server Components
 * WRITE functions: Route Handlers / Server Actions only
 */

import { prisma } from "@/lib/db/client";
import { verifyAccessToken, generateTokenPair } from "@/lib/auth/jwt";
import {
  getAccessToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import type { SessionUser, AuthResult, AdminRole } from "@/lib/auth/types";

// ============================================================================
// Read-Only Session (Safe for Server Components)
// ============================================================================

/**
 * Get current authenticated user.
 *
 * READ-ONLY: Safe for Server Components.
 * Assumes middleware has already validated/refreshed the token.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

/**
 * Require authenticated user or throw.
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

// ============================================================================
// Login Operations (Route Handlers / Server Actions ONLY)
// ============================================================================

/**
 * Authenticate with email and password.
 *
 * WRITES COOKIES: Use in Route Handlers or Server Actions only.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin) {
    return { success: false, error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  const { accessToken, refreshToken } = await generateTokenPair({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as AdminRole,
  });

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

/**
 * Authenticate with Google OAuth.
 *
 * WRITES COOKIES: Use in Route Handlers or Server Actions only.
 */
export async function loginWithGoogle(
  googleEmail: string
): Promise<AuthResult> {
  const admin = await prisma.admin.findUnique({
    where: { email: googleEmail.toLowerCase() },
  });

  if (!admin) {
    return {
      success: false,
      error: "This Google account is not authorized as an administrator",
    };
  }

  const { accessToken, refreshToken } = await generateTokenPair({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as AdminRole,
  });

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

/**
 * Clear all auth cookies.
 *
 * WRITES COOKIES: Use in Route Handlers or Server Actions only.
 */
export async function logout(): Promise<void> {
  await clearAuthCookies();
}
