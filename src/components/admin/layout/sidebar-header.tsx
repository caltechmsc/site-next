"use client";

import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { SessionUser } from "@/lib/auth/types";

// ============================================================================
// Types
// ============================================================================

interface SidebarHeaderProps {
  user: SessionUser;
  collapsed?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SidebarHeader({ user, collapsed = false }: SidebarHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-4">
      {/* Logo */}
      <Link
        href="/admin"
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg",
          "transition-transform hover:scale-105",
          collapsed ? "h-10 w-10" : "h-12 w-12"
        )}
      >
        <Image
          src={siteConfig.images.logo}
          alt={siteConfig.name}
          width={collapsed ? 40 : 48}
          height={collapsed ? 40 : 48}
          className="object-contain"
          priority
        />
      </Link>

      {/* Site Name & User Info */}
      {!collapsed && (
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">MSC Admin</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
          <span className="mt-0.5 inline-flex">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase",
                user.role === "admin"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {user.role}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
