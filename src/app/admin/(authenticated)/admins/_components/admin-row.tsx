/**
 * Admin Row Component
 *
 * Single row in the administrator list.
 */

"use client";

import * as React from "react";
import { Pencil, Trash2, MoreHorizontal, KeyRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminListItem } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface AdminRowProps {
  /** Admin data */
  admin: AdminListItem;
  /** Whether this admin is the current user */
  isSelf: boolean;
  /** Called when edit is requested */
  onEdit: (admin: AdminListItem) => void;
  /** Called when delete is requested */
  onDelete: (admin: AdminListItem) => void;
  /** Called when change password is requested (self only) */
  onChangePassword: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// Component
// ============================================================================

export function AdminRow({
  admin,
  isSelf,
  onEdit,
  onDelete,
  onChangePassword,
}: AdminRowProps) {
  const isAdmin = admin.role === "admin";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3",
        "transition-all duration-200",
        "hover:bg-accent/50"
      )}
    >
      {/* Avatar Circle */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
          isAdmin
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {admin.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
      </div>

      {/* Admin Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{admin.name}</span>
          {isSelf && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{admin.email}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>Joined {formatDate(admin.createdAt)}</span>
        </div>
      </div>

      {/* Role Badge */}
      <Badge
        variant={isAdmin ? "default" : "secondary"}
        className="shrink-0 capitalize"
      >
        {admin.role}
      </Badge>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(admin)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {isSelf && (
            <DropdownMenuItem onClick={onChangePassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
          )}
          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(admin)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
