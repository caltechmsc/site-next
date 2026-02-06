/**
 * Member Row Component
 *
 * Single row in the sortable member list.
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
import { MemberPortrait } from "@/components/ui/member-portrait";
import type { MemberListItem } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface MemberRowProps {
  /** Member data */
  member: MemberListItem;
  /** Called when edit is requested */
  onEdit: (member: MemberListItem) => void;
  /** Called when delete is requested */
  onDelete: (member: MemberListItem) => void;
  /** Called when visibility toggle is requested */
  onToggleHidden: (member: MemberListItem) => void;
}

// ============================================================================
// Component
// ============================================================================

export function MemberRow({
  member,
  onEdit,
  onDelete,
  onToggleHidden,
}: MemberRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

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
        isDragging && "z-10 opacity-90 shadow-lg ring-2 ring-primary",
        member.isHidden && "opacity-60"
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

      {/* Avatar */}
      <MemberPortrait
        name={member.name}
        photo={member.photo}
        size="md"
        variant="circle"
      />

      {/* Member Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{member.name}</span>
          {member.isHidden && (
            <Badge variant="outline" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {member.position && <span>{member.position}</span>}
          {member.position && member.email && (
            <span className="text-muted-foreground/50">•</span>
          )}
          {member.email && <span>{member.email}</span>}
        </div>
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
          <DropdownMenuItem onClick={() => onEdit(member)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleHidden(member)}>
            {member.isHidden ? (
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
            onClick={() => onDelete(member)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
