/**
 * Reorder Utilities
 *
 * Sparse interval ordering system for efficient drag-and-drop sorting.
 * Uses gap-based ordering to minimize database updates.
 */

// ============================================================================
// Constants
// ============================================================================

/** Default gap between order values */
export const ORDER_GAP = 1000;

/** Minimum usable gap before rebalancing is needed */
export const MIN_GAP = 1;

// ============================================================================
// Types
// ============================================================================

export interface OrderedItem {
  id: string;
  order: number;
}

export interface ReorderResult {
  /** Items that need to be updated in the database */
  updates: OrderedItem[];
  /** Whether a full rebalance was performed */
  rebalanced: boolean;
}

// ============================================================================
// Order Calculation
// ============================================================================

/**
 * Calculate the order value for inserting an item at a specific position.
 */
export function calculateInsertOrder(
  items: OrderedItem[],
  targetIndex: number
): number | null {
  // Empty list - use initial gap
  if (items.length === 0) {
    return ORDER_GAP;
  }

  // Insert at the beginning
  if (targetIndex === 0) {
    const firstOrder = items[0].order;
    // Ensure there's room before the first item
    if (firstOrder > ORDER_GAP) {
      return Math.floor(firstOrder / 2);
    }
    return firstOrder - ORDER_GAP;
  }

  // Insert at the end
  if (targetIndex >= items.length) {
    return items[items.length - 1].order + ORDER_GAP;
  }

  // Insert in the middle
  const beforeOrder = items[targetIndex - 1].order;
  const afterOrder = items[targetIndex].order;
  const gap = afterOrder - beforeOrder;

  if (gap > MIN_GAP) {
    return Math.floor((beforeOrder + afterOrder) / 2);
  }

  // Gap too small, need rebalancing
  return null;
}

/**
 * Get the order value for appending an item to the end of a list.
 */
export function getAppendOrder(items: OrderedItem[]): number {
  if (items.length === 0) {
    return ORDER_GAP;
  }
  return items[items.length - 1].order + ORDER_GAP;
}

// ============================================================================
// Rebalancing
// ============================================================================

/**
 * Check if rebalancing is needed for an insertion.
 */
export function needsRebalance(
  beforeOrder: number,
  afterOrder: number
): boolean {
  return afterOrder - beforeOrder <= MIN_GAP;
}

/**
 * Rebalance all items with fresh order values.
 */
export function rebalanceOrder(
  items: { id: string }[],
  startOrder: number = ORDER_GAP
): OrderedItem[] {
  return items.map((item, index) => ({
    id: item.id,
    order: startOrder + index * ORDER_GAP,
  }));
}

// ============================================================================
// Move Operations
// ============================================================================

/**
 * Calculate the new order after moving an item within a list.
 */
export function calculateMoveOrder(
  items: OrderedItem[],
  fromIndex: number,
  toIndex: number
): ReorderResult {
  // No movement needed
  if (fromIndex === toIndex) {
    return { updates: [], rebalanced: false };
  }

  const movingItem = items[fromIndex];

  // Create a new array with the item removed
  const withoutItem = [
    ...items.slice(0, fromIndex),
    ...items.slice(fromIndex + 1),
  ];

  // Calculate target position in the new array
  const adjustedToIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;

  // Try to calculate new order without rebalancing
  const newOrder = calculateInsertOrder(withoutItem, adjustedToIndex);

  if (newOrder !== null) {
    return {
      updates: [{ id: movingItem.id, order: newOrder }],
      rebalanced: false,
    };
  }

  // Need to rebalance - insert item at target position and rebalance all
  const reorderedItems = [
    ...withoutItem.slice(0, adjustedToIndex),
    movingItem,
    ...withoutItem.slice(adjustedToIndex),
  ];

  return {
    updates: rebalanceOrder(reorderedItems),
    rebalanced: true,
  };
}

/**
 * Reorder items based on a new order of IDs.
 */
export function reorderByIds(
  items: OrderedItem[],
  newOrderIds: string[]
): ReorderResult {
  // Build a map for quick lookup
  const itemMap = new Map(items.map((item) => [item.id, item]));

  // Create ordered list based on new ID order
  const orderedItems = newOrderIds
    .map((id) => itemMap.get(id))
    .filter((item): item is OrderedItem => item !== undefined);

  // Check if any rebalancing is needed
  let needsFullRebalance = false;
  const updates: OrderedItem[] = [];

  for (let i = 0; i < orderedItems.length; i++) {
    const targetOrder =
      i === 0
        ? ORDER_GAP
        : i === orderedItems.length - 1
          ? orderedItems[i - 1].order + ORDER_GAP
          : Math.floor(
              (orderedItems[i - 1].order +
                (orderedItems[i + 1]?.order ??
                  orderedItems[i - 1].order + ORDER_GAP * 2)) /
                2
            );

    // Check if we need rebalancing
    if (i > 0 && i < orderedItems.length - 1) {
      const prevOrder = orderedItems[i - 1].order;
      const nextOrder = orderedItems[i + 1]?.order ?? prevOrder + ORDER_GAP * 2;
      if (needsRebalance(prevOrder, nextOrder)) {
        needsFullRebalance = true;
        break;
      }
    }
  }

  if (needsFullRebalance) {
    return {
      updates: rebalanceOrder(orderedItems.map((item) => ({ id: item.id }))),
      rebalanced: true,
    };
  }

  // Calculate individual updates for changed positions
  for (let i = 0; i < orderedItems.length; i++) {
    const expectedOrder = ORDER_GAP + i * ORDER_GAP;
    const currentOrder = orderedItems[i].order;

    // Only include if order actually changed
    if (currentOrder !== expectedOrder) {
      // Simple sequential ordering since we're updating all
      updates.push({
        id: orderedItems[i].id,
        order: expectedOrder,
      });
    }
  }

  // If too many updates, just rebalance
  if (updates.length > orderedItems.length / 2) {
    return {
      updates: rebalanceOrder(orderedItems.map((item) => ({ id: item.id }))),
      rebalanced: true,
    };
  }

  return { updates, rebalanced: false };
}
