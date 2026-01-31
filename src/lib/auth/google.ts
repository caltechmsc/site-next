/**
 * Google OAuth Utilities
 *
 * Handles Google OAuth 2.0 flow for admin authentication.
 * Admins must be pre-registered in the database with their Google email.
 */

import { GOOGLE_OAUTH } from "@/lib/auth/constants";

// ============================================================================
// Types
// ============================================================================

export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

// ============================================================================
// OAuth URL Generation
// ============================================================================

/**
 * Generate the Google OAuth authorization URL.
 * User will be redirected here to grant permission.
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH.clientId,
    redirect_uri: GOOGLE_OAUTH.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH.scopes.join(" "),
    access_type: "offline",
    prompt: "select_account",
    ...(state && { state }),
  });

  return `${GOOGLE_OAUTH.authUrl}?${params.toString()}`;
}

// ============================================================================
// Token Exchange
// ============================================================================

/**
 * Exchange authorization code for access token.
 */
export async function exchangeCodeForToken(
  code: string
): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_OAUTH.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

// ============================================================================
// User Info
// ============================================================================

/**
 * Fetch user info from Google using access token.
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_OAUTH.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  return response.json();
}
