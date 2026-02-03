/**
 * Session Management
 *
 * High-level authentication functions.
 */

import { prisma } from "@/lib/db/client";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  generateTokenPair,
} from "@/lib/auth/jwt";
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  setAccessCookie,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import type { SessionUser, AuthResult, AdminRole } from "@/lib/auth/types";

// ============================================================================
// Session Retrieval
// ============================================================================

/**
 * Get current authenticated user from access token only.
 *
 * READ-ONLY: Safe for Server Components.
 * Does NOT refresh tokens.
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
 * Get authenticated user with automatic token refresh.
 *
 * USE THIS for Server Actions and API Routes that need authentication.
 *
 * Behavior:
 * 1. If access token is valid → return user immediately
 * 2. If access token expired but refresh token valid → refresh & return user
 * 3. If both invalid → clear cookies & return null
 *
 * WRITES COOKIES: Only when refreshing, safe in Server Actions/API Routes.
 */
export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  // 1. Fast path: valid access token
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

  // 2. Access token invalid/expired, try refresh
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const refreshPayload = await verifyRefreshToken(refreshToken);
  if (!refreshPayload) {
    // Refresh token also invalid, clear everything
    await clearAuthCookies();
    return null;
  }

  // 3. Refresh token valid, get latest user info from DB
  const admin = await prisma.admin.findUnique({
    where: { id: refreshPayload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!admin) {
    // User no longer exists
    await clearAuthCookies();
    return null;
  }

  // 4. Generate new access token and set cookie
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

/**
 * Require authenticated user or throw.
 *
 * Uses getAuthenticatedUser() internally, so supports auto-refresh.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getAuthenticatedUser();
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
