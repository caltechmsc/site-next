/**
 * Category Row Component
 *
 * Single row in the sortable category list.
 */

"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryWithCount } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface CategoryRowProps {
  /** Category data */
  category: CategoryWithCount;
  /** Called when edit is requested */
  onEdit: (category: CategoryWithCount) => void;
  /** Called when delete is requested */
  onDelete: (category: CategoryWithCount) => void;
  /** Called when show by default toggle changes */
  onToggleDefault: (category: CategoryWithCount) => void;
}

// ============================================================================
// Component
// ============================================================================

export function CategoryRow({
  category,
  onEdit,
  onDelete,
  onToggleDefault,
}: CategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const memberCount = category._count.members;
  const canDelete = memberCount === 0;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3",
        "transition-all duration-200",
        "hover:bg-accent/50",
        isDragging && "z-10 opacity-90 shadow-lg ring-2 ring-primary"
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className={cn(
          "flex h-8 w-8 shrink-0 cursor-grab items-center justify-center",
          "rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "active:cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
        <span className="sr-only">Drag to reorder</span>
      </button>

      {/* Category Name */}
      <div className="min-w-0 flex-1">
        <span className="font-medium">{category.name}</span>
      </div>

      {/* Member Count Badge */}
      <Badge variant="secondary" className="shrink-0">
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </Badge>

      {/* Show by Default Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id={`default-${category.id}`}
          checked={category.showByDefault}
          onCheckedChange={() => onToggleDefault(category)}
          aria-label="Show by default on public site"
        />
        <label
          htmlFor={`default-${category.id}`}
          className="cursor-pointer whitespace-nowrap text-sm text-muted-foreground"
        >
          Default
        </label>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(category)}
            disabled={!canDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
            {!canDelete && (
              <span className="ml-auto text-xs opacity-60">(has members)</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
