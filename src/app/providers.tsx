/**
 * Application Providers
 *
 * Centralized provider wrapper for all context providers.
 * Keeps the root layout clean and makes providers easy to manage.
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// ============================================================================
// Types
// ============================================================================

interface ProvidersProps {
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Root providers wrapper.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
