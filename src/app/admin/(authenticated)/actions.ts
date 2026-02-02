"use server";

import { logout as logoutSession } from "@/lib/auth/session";

// ============================================================================
// Logout Action
// ============================================================================

/**
 * Logs out the current user by clearing auth cookies and redirecting.
 */
export async function logoutAction(): Promise<void> {
  await logoutSession();
}
