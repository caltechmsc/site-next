/**
 * Category Server Actions
 *
 * CRUD operations for member categories with type-safe validation.
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { categorySchema, reorderSchema, idSchema } from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";

// ============================================================================
// Types
// ============================================================================

export interface CategoryWithCount {
  id: string;
  name: string;
  order: number;
  showByDefault: boolean;
  _count: {
    members: number;
  };
}

// ============================================================================
// Schemas (Extended)
// ============================================================================

const updateCategorySchema = categorySchema.extend({
  id: idSchema,
});

const deleteCategorySchema = z.object({
  id: idSchema,
});

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all categories with member counts, ordered by display order.
 */
export const getCategories = createAction(
  async (): Promise<CategoryWithCount[]> => {
    return prisma.memberCategory.findMany({
      select: {
        id: true,
        name: true,
        order: true,
        showByDefault: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });
  }
);

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new category at the end of the order.
 * Returns the created category with count.
 */
export const createCategory = createSafeAction(
  categorySchema,
  async (data): Promise<CategoryWithCount> => {
    // Get the maximum order value
    const maxOrder = await prisma.memberCategory.aggregate({
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    const category = await prisma.memberCategory.create({
      data: {
        name: data.name,
        showByDefault: data.showByDefault ?? true,
        order: newOrder,
      },
      select: {
        id: true,
        name: true,
        order: true,
        showByDefault: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return category;
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an existing category.
 * Returns the updated category with count.
 */
export const updateCategory = createSafeAction(
  updateCategorySchema,
  async (data): Promise<CategoryWithCount> => {
    const category = await prisma.memberCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        showByDefault: data.showByDefault,
      },
      select: {
        id: true,
        name: true,
        order: true,
        showByDefault: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return category;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a category if it has no members.
 */
export const deleteCategory = createSafeAction(
  deleteCategorySchema,
  async (data): Promise<void> => {
    // Check if category has members
    const category = await prisma.memberCategory.findUnique({
      where: { id: data.id },
      select: {
        name: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!category) {
      throw new ActionError("Category not found");
    }

    if (category._count.members > 0) {
      throw new ActionError(
        `Cannot delete "${category.name}" because it has ${category._count.members} member(s). ` +
          "Please reassign or remove all members first."
      );
    }

    await prisma.memberCategory.delete({
      where: { id: data.id },
    });
  }
);

// ============================================================================
// Reorder Operation
// ============================================================================

/**
 * Reorder categories using a transaction for atomicity.
 */
export const reorderCategories = createSafeAction(
  reorderSchema,
  async (data): Promise<void> => {
    await prisma.$transaction(
      data.items.map(({ id, order }) =>
        prisma.memberCategory.update({
          where: { id },
          data: { order },
        })
      )
    );
  }
);
