/**
 * Authentication Module
 */

// Session management (high-level API)
export {
  getCurrentUser,
  getCurrentUserWithRefresh,
  refreshSession,
  loginWithPassword,
  loginWithGoogle,
  logout,
  requireAuth,
  hasRole,
  type SessionUser,
  type AuthResult,
} from "./session";

// JWT utilities
export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from "./jwt";

// Cookie management
export {
  setAuthCookies,
  setAccessCookie,
  getAccessToken,
  getRefreshToken,
  clearAuthCookies,
} from "./cookies";

// Password utilities
export { hashPassword, verifyPassword } from "./password";

// Google OAuth
export {
  getGoogleAuthUrl,
  exchangeCodeForToken,
  getGoogleUserInfo,
  type GoogleUserInfo,
} from "./google";

// Validation utilities
export {
  isValidRedirectUrl,
  sanitizeRedirectUrl,
  createOAuthErrorRedirect,
} from "./validation";

// Constants and types
export {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  COOKIE_OPTIONS,
  OAUTH_STATE_COOKIE,
  OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH,
  ADMIN_ROLES,
  type AdminRole,
} from "./constants";
