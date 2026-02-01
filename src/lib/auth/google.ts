/**
 * Google OAuth Utilities
 *
 * Functions for Google OAuth 2.0 authentication flow.
 */

import { GOOGLE_OAUTH } from "@/lib/auth/constants";
import type { GoogleUserInfo } from "@/lib/auth/types";

// ============================================================================
// OAuth URL Generation
// ============================================================================

/**
 * Generate Google OAuth authorization URL.
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH.clientId,
    redirect_uri: GOOGLE_OAUTH.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH.scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `${GOOGLE_OAUTH.authUrl}?${params.toString()}`;
}

// ============================================================================
// Token Exchange
// ============================================================================

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForToken(
  code: string
): Promise<{ access_token: string }> {
  const response = await fetch(GOOGLE_OAUTH.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH.clientId,
      client_secret: GOOGLE_OAUTH.clientSecret,
      redirect_uri: GOOGLE_OAUTH.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// ============================================================================
// User Info
// ============================================================================

/**
 * Get user info from Google using access token.
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_OAUTH.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get Google user info");
  }

  return response.json();
}
