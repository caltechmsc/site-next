/**
 * Authentication Module
 *
 * Centralized exports for the auth system.
 */

// ============================================================================
// Types
// ============================================================================

export type {
  AdminRole,
  AccessTokenPayload,
  RefreshTokenPayload,
  SessionUser,
  AuthResult,
  AuthCheckResult,
  GoogleUserInfo,
} from "./types";

export { ADMIN_ROLES } from "./types";

// ============================================================================
// Constants
// ============================================================================

export {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  COOKIE_OPTIONS,
  OAUTH_STATE_COOKIE,
  OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH,
} from "./constants";

// ============================================================================
// JWT
// ============================================================================

export {
  signAccessToken,
  signRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

// ============================================================================
// Cookies
// ============================================================================

export {
  setAuthCookies,
  setAccessCookie,
  getAccessToken,
  getRefreshToken,
  clearAuthCookies,
} from "./cookies";

// ============================================================================
// Session
// ============================================================================

export {
  getCurrentUser,
  requireAuth,
  hasRole,
  loginWithPassword,
  loginWithGoogle,
  logout,
} from "./session";

// ============================================================================
// Password
// ============================================================================

export { hashPassword, verifyPassword } from "./password";

// ============================================================================
// Validation
// ============================================================================

export { isValidRedirectUrl, sanitizeRedirectUrl } from "./validation";

// ============================================================================
// Google OAuth
// ============================================================================

export {
  getGoogleAuthUrl,
  exchangeCodeForToken,
  getGoogleUserInfo,
} from "./google";

// ============================================================================
// Middleware
// ============================================================================

export { checkAuthStatus, requiresAuth, isPublicApiRoute } from "./middleware";
