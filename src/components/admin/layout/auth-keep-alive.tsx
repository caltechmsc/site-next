/**
 * Auth Keep Alive Component
 *
 * Client-side component that periodically refreshes the access token
 * using the refresh token stored in HTTP-only cookies.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Refresh interval: 10 minutes (in milliseconds)
 * Access token expires in 15 minutes, so refresh at 10 minutes
 * gives a 5-minute buffer.
 */
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

/**
 * Minimum time between refreshes across all tabs.
 * If any tab refreshed within this window, other tabs skip their refresh.
 */
const MIN_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

/**
 * LocalStorage key for tracking last refresh time across tabs.
 */
const LAST_REFRESH_KEY = "last-token-refresh";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get last refresh timestamp from localStorage (shared across tabs).
 */
function getLastRefreshTime(): number {
  try {
    const stored = localStorage.getItem(LAST_REFRESH_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Update last refresh timestamp in localStorage (notifies other tabs).
 */
function setLastRefreshTime(timestamp: number): void {
  try {
    localStorage.setItem(LAST_REFRESH_KEY, timestamp.toString());
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================================================
// Component
// ============================================================================

export function AuthKeepAlive() {
  const router = useRouter();

  const refreshToken = React.useCallback(async () => {
    const now = Date.now();
    const lastRefresh = getLastRefreshTime();

    // Skip if another tab recently refreshed
    if (now - lastRefresh < MIN_REFRESH_INTERVAL) {
      return;
    }

    // Update timestamp BEFORE making request (prevents race condition)
    setLastRefreshTime(now);

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/admin/login?error=session_expired");
        return;
      }
    } catch (error) {
      setLastRefreshTime(0);
    }
  }, [router]);

  React.useEffect(() => {
    // Initial refresh on mount (in case access token is about to expire)
    refreshToken();

    // Set up periodic refresh
    const intervalId = setInterval(refreshToken, REFRESH_INTERVAL);

    // Handle visibility change (refresh when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshToken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshToken]);

  // This component renders nothing
  return null;
}
