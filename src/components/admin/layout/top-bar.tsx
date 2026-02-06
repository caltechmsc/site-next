"use client";

import { MobileNav } from "./mobile-nav";
import type { SessionUser } from "@/lib/auth/types";

// ============================================================================
// Types
// ============================================================================

interface TopBarProps {
  user: SessionUser;
  title?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TopBar({ user, title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
      {/* Mobile Menu */}
      <MobileNav user={user} />

      {/* Title */}
      <h1 className="flex-1 truncate text-lg font-semibold">
        {title ?? "Admin"}
      </h1>
    </header>
  );
}
