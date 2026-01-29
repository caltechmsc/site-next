"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { mainNav, type NavItem } from "@/config/site";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ============================================================================
// Header Component
// ============================================================================

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Site Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-msc-red dark:text-msc-red">MSC</span>
            <span className="hidden sm:inline">
              <span className="text-muted-foreground"> @ </span>
              <span className="text-primary">Caltech</span>
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNav />

        {/* Right Section */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Navigation</SheetTitle>
              </SheetHeader>
              <MobileNav onNavigate={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Desktop Navigation
// ============================================================================

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {mainNav.map((item) =>
        item.children ? (
          <NavDropdown key={item.href} item={item} />
        ) : (
          <NavLink key={item.href} href={item.href}>
            {item.title}
          </NavLink>
        )
      )}
    </nav>
  );
}

// ============================================================================
// NavLink - Simple navigation link
// ============================================================================

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function NavLink({ href, children, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {children}
    </Link>
  );
}

// ============================================================================
// NavDropdown - Dropdown menu for items with children
// ============================================================================

interface NavDropdownProps {
  item: NavItem;
}

function NavDropdown({ item }: NavDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Small delay to allow cursor movement to dropdown content
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "bg-accent/50"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {item.title}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1 min-w-[180px]",
            "rounded-md border bg-popover p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "block rounded-sm px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:bg-accent focus-visible:outline-none"
              )}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Mobile Navigation
// ============================================================================

interface MobileNavProps {
  onNavigate: () => void;
}

function MobileNav({ onNavigate }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-col gap-1">
      {mainNav.map((item) => (
        <MobileNavItem
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

interface MobileNavItemProps {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
  depth?: number;
}

function MobileNavItem({
  item,
  pathname,
  onNavigate,
  depth = 0,
}: MobileNavItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "text-primary"
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {item.title}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded && (
          <div className="mt-1">
            {item.children!.map((child) => (
              <MobileNavItem
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-primary"
      )}
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
    >
      {item.title}
    </Link>
  );
}
