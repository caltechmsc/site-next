/**
 * ThemeToggle - Dark/Light/System theme switcher
 *
 * Provides a button to cycle through theme modes:
 * Light → Dark → System → Light
 */

"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const THEME_CYCLE = ["light", "dark", "system"] as const;

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const THEME_LABELS = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System preference",
} as const;

// ============================================================================
// Component
// ============================================================================

/**
 * Theme toggle button that cycles through light, dark, and system themes.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle to next theme
  const cycleTheme = React.useCallback(() => {
    const currentIndex = THEME_CYCLE.indexOf(
      theme as (typeof THEME_CYCLE)[number]
    );
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  }, [theme, setTheme]);

  // Show skeleton during SSR to prevent hydration mismatch
  if (!mounted) {
    return <Skeleton className={cn("h-9 w-9 rounded-md", className)} />;
  }

  const currentTheme = (theme ?? "system") as keyof typeof THEME_ICONS;
  const Icon = THEME_ICONS[currentTheme];
  const label = THEME_LABELS[currentTheme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn("h-9 w-9", className)}
      aria-label={`Current theme: ${label}. Click to change.`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
