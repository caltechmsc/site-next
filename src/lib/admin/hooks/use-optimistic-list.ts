/**
 * Optimistic List Hook
 *
 * A custom hook for optimistic updates on lists.
 * Provides instant UI feedback while server operations complete.
 */

"use client";

import { useCallback, useOptimistic } from "react";
import type { ActionResult } from "@/lib/admin/actions/types";

// ============================================================================
// Types
// ============================================================================

export interface UseOptimisticListOptions<T> {
  /** Callback when an operation fails, allowing UI rollback notification */
  onError?: (error: string) => void;
}

type OptimisticAction<T> =
  | { type: "add"; item: T }
  | { type: "update"; id: string; data: Partial<T> }
  | { type: "delete"; id: string }
  | { type: "reorder"; items: T[] }
  | { type: "reset"; items: T[] };

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for optimistic updates on a list of items.
 */
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  options: UseOptimisticListOptions<T> = {}
) {
  const { onError } = options;

  const [items, dispatchOptimistic] = useOptimistic<T[], OptimisticAction<T>>(
    initialItems,
    (state, action) => {
      switch (action.type) {
        case "add":
          return [...state, action.item];

        case "update":
          return state.map((item) =>
            item.id === action.id ? { ...item, ...action.data } : item
          );

        case "delete":
          return state.filter((item) => item.id !== action.id);

        case "reorder":
          return action.items;

        case "reset":
          return action.items;

        default:
          return state;
      }
    }
  );

  /**
   * Optimistically add an item.
   */
  const addOptimistic = useCallback(
    (item: T) => {
      dispatchOptimistic({ type: "add", item });
    },
    [dispatchOptimistic]
  );

  /**
   * Optimistically update an item.
   */
  const updateOptimistic = useCallback(
    (id: string, data: Partial<T>) => {
      dispatchOptimistic({ type: "update", id, data });
    },
    [dispatchOptimistic]
  );

  /**
   * Optimistically delete an item.
   */
  const deleteOptimistic = useCallback(
    (id: string) => {
      dispatchOptimistic({ type: "delete", id });
    },
    [dispatchOptimistic]
  );

  /**
   * Optimistically reorder items.
   */
  const reorderOptimistic = useCallback(
    (newItems: T[]) => {
      dispatchOptimistic({ type: "reorder", items: newItems });
    },
    [dispatchOptimistic]
  );

  /**
   * Reset the list to a new state.
   */
  const resetList = useCallback(
    (newItems: T[]) => {
      dispatchOptimistic({ type: "reset", items: newItems });
    },
    [dispatchOptimistic]
  );

  /**
   * Execute a server action with optimistic update.
   * Automatically handles error callback.
   */
  const withOptimistic = useCallback(
    async <TResult>(
      optimisticUpdate: () => void,
      serverAction: () => Promise<ActionResult<TResult>>
    ): Promise<ActionResult<TResult>> => {
      // Apply optimistic update
      optimisticUpdate();

      // Execute server action
      const result = await serverAction();

      // Handle error
      if (!result.success) {
        onError?.(result.error);
      }

      return result;
    },
    [onError]
  );

  return {
    items,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    reorderOptimistic,
    resetList,
    withOptimistic,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

export interface OrderedItem {
  id: string;
  order: number;
}

/**
 * Hook specifically for reorderable lists.
 * Handles order field updates optimistically.
 */
export function useReorderableList<T extends OrderedItem>(
  initialItems: T[],
  options: UseOptimisticListOptions<T> = {}
) {
  const base = useOptimisticList(initialItems, options);

  /**
   * Move an item from one index to another.
   */
  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      const newItems = [...base.items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      // Update order values
      const reordered = newItems.map((item, index) => ({
        ...item,
        order: (index + 1) * 1000,
      }));

      base.reorderOptimistic(reordered);

      return reordered;
    },
    [base]
  );

  /**
   * Reorder based on new ID order.
   */
  const reorderByIds = useCallback(
    (newOrderIds: string[]) => {
      const itemMap = new Map(base.items.map((item) => [item.id, item]));
      const reordered = newOrderIds
        .map((id, index) => {
          const item = itemMap.get(id);
          return item ? { ...item, order: (index + 1) * 1000 } : null;
        })
        .filter((item): item is T => item !== null);

      base.reorderOptimistic(reordered);

      return reordered;
    },
    [base]
  );

  return {
    ...base,
    moveItem,
    reorderByIds,
  };
}
