/**
 * Research Row Component
 *
 * Single row in the sortable research area tree.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  ExternalLink,
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
import type {
  ResearchAreaListItem,
  ResearchAreaWithChildren,
} from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface ResearchRowProps {
  /** Research area data */
  area: ResearchAreaListItem | ResearchAreaWithChildren;
  /** Whether this is a child row */
  isChild?: boolean;
  /** Whether the children are expanded (only for parent rows) */
  isExpanded?: boolean;
  /** Whether the parent has children */
  hasChildren?: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand?: () => void;
  /** Called when edit is requested */
  onEdit: (area: ResearchAreaListItem | ResearchAreaWithChildren) => void;
  /** Called when delete is requested */
  onDelete: (area: ResearchAreaListItem | ResearchAreaWithChildren) => void;
  /** Called when visibility toggle is requested */
  onToggleHidden: (
    area: ResearchAreaListItem | ResearchAreaWithChildren
  ) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ResearchRow({
  area,
  isChild = false,
  isExpanded = false,
  hasChildren = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleHidden,
}: ResearchRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id });

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
        area.isHidden && "opacity-60",
        isChild && "border-dashed"
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

      {/* Expand/Collapse Toggle (for parents with children) */}
      {!isChild && hasChildren ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">{isExpanded ? "Collapse" : "Expand"}</span>
        </Button>
      ) : !isChild ? (
        <div className="w-6 shrink-0" /> // Spacer for alignment
      ) : null}

      {/* Title & Slug */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{area.title}</span>
          {area.isHidden && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Hidden
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-mono text-xs">/{area.slug}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <FileText className="h-3 w-3" />
          {area.stats.publicationCount}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {area.stats.memberCount}
        </Badge>
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
          <DropdownMenuItem onClick={() => onEdit(area)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/research/${area.slug}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on site
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToggleHidden(area)}>
            {area.isHidden ? (
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
            onClick={() => onDelete(area)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
