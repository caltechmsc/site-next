"use client";

import { useState, useEffect, useCallback } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarFooter } from "./sidebar-footer";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_COLLAPSED_KEY,
} from "./constants";
import type { SessionUser } from "@/lib/auth/types";

// ============================================================================
// Types
// ============================================================================

interface SidebarProps {
  user: SessionUser;
}

// ============================================================================
// Component
// ============================================================================

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  // Toggle collapse state
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside
        className="hidden lg:flex lg:flex-col lg:border-r lg:bg-card"
        style={{ width: SIDEBAR_WIDTH }}
      />
    );
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:border-r lg:bg-card",
        "transition-[width] duration-200 ease-in-out"
      )}
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
    >
      {/* Header */}
      <SidebarHeader user={user} collapsed={collapsed} />

      {/* Collapse Toggle */}
      <div className="px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={cn(
            "w-full justify-start gap-2 text-muted-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* Navigation */}
      <SidebarNav userRole={user.role} collapsed={collapsed} />

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}
