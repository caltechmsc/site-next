/**
 * Photo Row Component
 *
 * Single row in the sortable photo list.
 */

"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/date";
import type { PhotoListItem } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface PhotoRowProps {
  /** Photo data */
  photo: PhotoListItem;
  /** Called when edit is requested */
  onEdit: (photo: PhotoListItem) => void;
  /** Called when delete is requested */
  onDelete: (photo: PhotoListItem) => void;
}

// ============================================================================
// Component
// ============================================================================

export function PhotoRow({ photo, onEdit, onDelete }: PhotoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

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

      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.imageUrl}
        alt={photo.caption || `Photo from ${formatDate(photo.date, "medium")}`}
        className="h-16 w-24 shrink-0 rounded-md object-cover"
      />

      {/* Photo Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatDate(photo.date, "medium")}
          </span>
        </div>
        {photo.caption && (
          <p className="truncate text-sm text-muted-foreground">
            {photo.caption}
          </p>
        )}
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
          <DropdownMenuItem onClick={() => onEdit(photo)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(photo)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
