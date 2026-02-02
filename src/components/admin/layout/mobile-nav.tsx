"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarFooter } from "./sidebar-footer";
import type { SessionUser } from "@/lib/auth/types";

// ============================================================================
// Types
// ============================================================================

interface MobileNavProps {
  user: SessionUser;
}

// ============================================================================
// Component
// ============================================================================

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close sheet on navigation
  const handleNavigation = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>

        {/* Header */}
        <SidebarHeader user={user} />

        {/* Navigation */}
        <div onClick={handleNavigation}>
          <SidebarNav userRole={user.role} />
        </div>

        {/* Footer */}
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}
