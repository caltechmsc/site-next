"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  Handshake,
  Camera,
  FileText,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/auth/types";

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can access this item (undefined = all roles) */
  roles?: AdminRole[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  userRole: AdminRole;
  collapsed?: boolean;
}

// ============================================================================
// Navigation Config
// ============================================================================

const navGroups: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Research",
        href: "/admin/research",
        icon: FlaskConical,
      },
      {
        label: "Publications",
        href: "/admin/publications",
        icon: FileText,
      },
      {
        label: "Members",
        href: "/admin/members",
        icon: Users,
      },
      {
        label: "Collaborators",
        href: "/admin/collaborators",
        icon: Handshake,
      },
      {
        label: "Photos",
        href: "/admin/photos",
        icon: Camera,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Administrators",
        href: "/admin/admins",
        icon: ShieldCheck,
        roles: ["admin"], // Full management view
      },
      {
        label: "My Account",
        href: "/admin/admins",
        icon: UserCog,
        roles: ["editor"], // Personal account settings
      },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user has access to a nav item.
 */
function hasAccess(item: NavItem, userRole: AdminRole): boolean {
  if (!item.roles) return true;
  return item.roles.includes(userRole);
}

/**
 * Check if a path is active.
 */
function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname.startsWith(href);
}

// ============================================================================
// Components
// ============================================================================

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function NavGroupComponent({
  group,
  userRole,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  userRole: AdminRole;
  pathname: string;
  collapsed: boolean;
}) {
  const visibleItems = group.items.filter((item) => hasAccess(item, userRole));

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-1">
      {/* Group Label */}
      {group.label && !collapsed && (
        <div className="px-3 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            {group.label}
          </span>
        </div>
      )}
      {group.label && collapsed && (
        <div className="mx-auto my-2 h-px w-8 bg-border" />
      )}

      {/* Nav Items */}
      <nav className="space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            active={isActive(item.href, pathname)}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SidebarNav({ userRole, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-2 py-2">
      {navGroups.map((group, index) => (
        <NavGroupComponent
          key={group.label ?? index}
          group={group}
          userRole={userRole}
          pathname={pathname}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}
