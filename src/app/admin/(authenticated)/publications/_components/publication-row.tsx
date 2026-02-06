/**
 * Publication Row Component
 *
 * Single row in the sortable publication list.
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
  ExternalLink,
  Quote,
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
import { parseAuthors, joinAuthors, formatCompactNumber } from "@/lib/format";
import { getYear } from "@/lib/date";
import type { PublicationListItem } from "./publication-list";

// ============================================================================
// Types
// ============================================================================

export interface PublicationRowProps {
  /** Publication data */
  publication: PublicationListItem;
  /** Called when edit is requested */
  onEdit: (publication: PublicationListItem) => void;
  /** Called when delete is requested */
  onDelete: (publication: PublicationListItem) => void;
  /** Whether drag-and-drop is disabled (e.g. during search) */
  isDndDisabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PublicationRow({
  publication,
  onEdit,
  onDelete,
  isDndDisabled = false,
}: PublicationRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: publication.id, disabled: isDndDisabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const authors = parseAuthors(publication.authors);
  const year = getYear(publication.date);

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
          "active:cursor-grabbing",
          isDndDisabled && "cursor-default opacity-30"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
        <span className="sr-only">Drag to reorder</span>
      </button>

      {/* Index Badge */}
      <Badge
        variant="outline"
        className="h-7 w-10 shrink-0 justify-center tabular-nums"
      >
        {publication.index}
      </Badge>

      {/* Publication Info */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h4 className="truncate text-sm font-medium leading-snug">
          {publication.title}
        </h4>

        {/* Authors */}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {joinAuthors(authors, 3)}
        </p>

        {/* Meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {/* Year */}
          <span className="tabular-nums">{year}</span>

          {/* Journal */}
          {publication.journal && (
            <>
              <span className="text-border">·</span>
              <span className="italic">{publication.journal}</span>
            </>
          )}

          {/* Citations */}
          {publication.citations > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-0.5">
                <Quote className="h-3 w-3" />
                <span className="tabular-nums">
                  {formatCompactNumber(publication.citations)}
                </span>
              </span>
            </>
          )}

          {/* DOI indicator */}
          {publication.doi && (
            <>
              <span className="text-border">·</span>
              <a
                href={`https://doi.org/${publication.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-primary/70 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                DOI
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(publication)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {publication.doi && (
            <DropdownMenuItem asChild>
              <a
                href={`https://doi.org/${publication.doi}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on DOI
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(publication)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
