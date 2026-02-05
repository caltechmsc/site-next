/**
 * Sortable List Component
 *
 * Drag-and-drop reorderable list using @dnd-kit.
 * Provides a flexible wrapper for any sortable content.
 */

"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SortableItem {
  id: string;
  [key: string]: unknown;
}

export interface SortableListProps<T extends SortableItem> {
  /** Items to display */
  items: T[];
  /** Callback when items are reordered */
  onReorder: (items: T[]) => void;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Whether sorting is disabled */
  disabled?: boolean;
  /** Additional class names for the list container */
  className?: string;
}

export interface SortableItemWrapperProps {
  /** Unique ID for the sortable item */
  id: string;
  /** Whether sorting is disabled */
  disabled?: boolean;
  /** Child content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Sortable Item Wrapper
// ============================================================================

/**
 * Wrapper component for sortable items.
 * Provides drag handle and transform styles.
 */
export function SortableItemWrapper({
  id,
  disabled = false,
  children,
  className,
}: SortableItemWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-center gap-2",
        isDragging && "opacity-50",
        className
      )}
    >
      {/* Drag Handle */}
      {!disabled && (
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
      )}

      {/* Item Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ============================================================================
// Sortable List
// ============================================================================

/**
 * Drag-and-drop sortable list.
 */
export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className,
}: SortableListProps<T>) {
  // Configure sensors for pointer and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder items
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          onReorder(arrayMove(items, oldIndex, newIndex));
        }
      }
    },
    [items, onReorder]
  );

  const itemIds = React.useMemo(() => items.map((item) => item.id), [items]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={itemIds}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className={cn("space-y-2", className)}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {renderItem(item, index)}
            </React.Fragment>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ============================================================================
// Utility Hook
// ============================================================================

/**
 * Hook to manage sortable list state with server sync.
 */
export function useSortableList<T extends SortableItem>(
  initialItems: T[],
  onReorderServer?: (items: T[]) => Promise<void>
) {
  const [items, setItems] = React.useState(initialItems);
  const [isPending, setIsPending] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleReorder = React.useCallback(
    async (newItems: T[]) => {
      // Optimistic update
      setItems(newItems);

      // Persist to server if handler provided
      if (onReorderServer) {
        setIsPending(true);
        try {
          await onReorderServer(newItems);
        } catch (error) {
          // Rollback on error
          setItems(initialItems);
          console.error("Failed to save order:", error);
        } finally {
          setIsPending(false);
        }
      }
    },
    [initialItems, onReorderServer]
  );

  return {
    items,
    handleReorder,
    isPending,
  };
}
