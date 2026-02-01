/**
 * JWT Token Management
 *
 * Edge-compatible JWT operations using `jose` library.
 * Implements dual-token strategy: Access (short) + Refresh (long).
 */

import { SignJWT, jwtVerify } from "jose";

import { ACCESS_TOKEN, REFRESH_TOKEN, JWT_SECRET } from "@/lib/auth/constants";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  AdminRole,
} from "@/lib/auth/types";

// ============================================================================
// Secret Key
// ============================================================================

const jwtSecretBytes = new TextEncoder().encode(JWT_SECRET);

function getSecret(): Uint8Array {
  return jwtSecretBytes;
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Sign an Access Token with user identity.
 */
export async function signAccessToken(user: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: "access",
  } satisfies Omit<AccessTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: ACCESS_TOKEN.algorithm })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN.maxAge}s`)
    .sign(getSecret());
}

/**
 * Sign a Refresh Token with minimal payload.
 */
export async function signRefreshToken(adminId: string): Promise<string> {
  return new SignJWT({
    sub: adminId,
    type: "refresh",
  } satisfies Omit<RefreshTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: REFRESH_TOKEN.algorithm })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN.maxAge}s`)
    .sign(getSecret());
}

/**
 * Generate both tokens for a user.
 */
export async function generateTokenPair(user: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    signRefreshToken(user.id),
  ]);
  return { accessToken, refreshToken };
}

// ============================================================================
// Token Verification
// ============================================================================

/**
 * Verify and decode an Access Token.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ACCESS_TOKEN.algorithm],
    });

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
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [REFRESH_TOKEN.algorithm],
    });

    if (payload.type !== "refresh") {
      return null;
    }

    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}
