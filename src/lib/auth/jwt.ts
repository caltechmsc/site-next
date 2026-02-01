/**
 * JWT Token Management
 *
 * Uses `jose` library for edge-compatible JWT operations.
 * Implements dual-token strategy: Access (short) + Refresh (long).
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  JWT_SECRET,
  type AdminRole,
} from "@/lib/auth/constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Payload stored in Access Token.
 * Contains user identity for quick authorization without DB lookup.
 */
export interface AccessTokenPayload extends JWTPayload {
  sub: string; // Admin ID
  email: string;
  name: string;
  role: AdminRole;
  type: "access";
}

/**
 * Payload stored in Refresh Token.
 * Minimal data - full user info fetched from DB during refresh.
 */
export interface RefreshTokenPayload extends JWTPayload {
  sub: string; // Admin ID
  type: "refresh";
}

// ============================================================================
// Secret Key
// ============================================================================

/**
 * JWT secret as Uint8Array for jose library.
 */
const jwtSecretBytes = new TextEncoder().encode(JWT_SECRET);

/**
 * Get the JWT secret for signing/verification.
 */
function getSecret(): Uint8Array {
  return jwtSecretBytes;
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Sign an Access Token with user identity.
 */
export async function signAccessToken(payload: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}): Promise<string> {
  const token = await new SignJWT({
    sub: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    type: "access",
  } satisfies Omit<AccessTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: ACCESS_TOKEN.algorithm })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN.maxAge}s`)
    .sign(getSecret());

  return token;
}

/**
 * Sign a Refresh Token with minimal payload.
 */
export async function signRefreshToken(adminId: string): Promise<string> {
  const token = await new SignJWT({
    sub: adminId,
    type: "refresh",
  } satisfies Omit<RefreshTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: REFRESH_TOKEN.algorithm })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN.maxAge}s`)
    .sign(getSecret());

  return token;
}

// ============================================================================
// Token Verification
// ============================================================================

/**
 * Verify and decode an Access Token.
 * Returns null if invalid or expired.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ACCESS_TOKEN.algorithm],
    });

    // Type guard: ensure it's an access token
    if (payload.type !== "access") {
      return null;
    }

    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify and decode a Refresh Token.
 * Returns null if invalid or expired.
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [REFRESH_TOKEN.algorithm],
    });

    // Type guard: ensure it's a refresh token
    if (payload.type !== "refresh") {
      return null;
    }

    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// Token Pair Generation
// ============================================================================

/**
 * Generate both Access and Refresh tokens for a user.
 * Used after successful authentication.
 */
export async function generateTokenPair(admin: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(admin),
    signRefreshToken(admin.id),
  ]);

  return { accessToken, refreshToken };
}
