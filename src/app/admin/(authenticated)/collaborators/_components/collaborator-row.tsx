/**
 * Collaborator Row Component
 *
 * Single row in the sortable collaborator list.
 */

"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  MapPin,
  Globe,
  Mail,
} from "lucide-react";

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
import type { CollaboratorListItem } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface CollaboratorRowProps {
  /** Collaborator data */
  collaborator: CollaboratorListItem;
  /** Called when edit is requested */
  onEdit: (collaborator: CollaboratorListItem) => void;
  /** Called when delete is requested */
  onDelete: (collaborator: CollaboratorListItem) => void;
  /** Called when visibility toggle is requested */
  onToggleHidden: (collaborator: CollaboratorListItem) => void;
}

// ============================================================================
// Component
// ============================================================================

export function CollaboratorRow({
  collaborator,
  onEdit,
  onDelete,
  onToggleHidden,
}: CollaboratorRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collaborator.id });

  const hasCoords =
    collaborator.latitude !== null && collaborator.longitude !== null;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Build location string
  const locationParts: string[] = [];
  if (collaborator.city) locationParts.push(collaborator.city);
  if (collaborator.country) locationParts.push(collaborator.country);
  const location = locationParts.join(", ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3",
        "transition-all duration-200",
        "hover:bg-accent/50",
        isDragging && "z-10 opacity-90 shadow-lg ring-2 ring-primary",
        collaborator.isHidden && "opacity-60"
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

      {/* Collaborator Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{collaborator.organization}</span>
          {collaborator.isHidden && (
            <Badge variant="outline" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {collaborator.leader && <span>{collaborator.leader}</span>}
          {location && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {location}
            </span>
          )}
          {collaborator.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {collaborator.email}
            </span>
          )}
        </div>
      </div>

      {/* Map Indicator */}
      {hasCoords && (
        <Badge variant="secondary" className="shrink-0 gap-1">
          <MapPin className="h-3 w-3" />
          On map
        </Badge>
      )}

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(collaborator)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleHidden(collaborator)}>
            {collaborator.isHidden ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(collaborator)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
