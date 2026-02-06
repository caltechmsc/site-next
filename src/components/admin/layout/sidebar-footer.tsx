"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Monitor, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/admin/(authenticated)/actions";

// ============================================================================
// Types
// ============================================================================

interface SidebarFooterProps {
  collapsed?: boolean;
}

// ============================================================================
// Theme Toggle Component
// ============================================================================

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(
            "w-full justify-start gap-2",
            collapsed && "justify-center"
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          {!collapsed && <span>Theme</span>}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "center" : "start"} side="top">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/admin/login");
    });
  };

  return (
    <div
      className={cn(
        "border-t p-2",
        collapsed ? "space-y-1" : "flex items-center gap-1"
      )}
    >
      {/* Theme Toggle */}
      <ThemeToggle collapsed={collapsed ?? false} />

      {/* Logout Button */}
      <Button
        variant="ghost"
        size={collapsed ? "icon" : "sm"}
        onClick={handleLogout}
        disabled={isPending}
        className={cn(
          "text-muted-foreground hover:text-destructive",
          collapsed ? "w-full justify-center" : "justify-start gap-2"
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {!collapsed && <span>{isPending ? "Logging out..." : "Logout"}</span>}
        <span className="sr-only">Logout</span>
      </Button>
    </div>
  );
}
