/**
 * Research Area Server Actions
 *
 * CRUD operations for research areas with type-safe validation.
 * Supports hierarchical structure (max 2 levels: parent -> children).
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import {
  researchAreaSchema,
  reorderSchema,
  idSchema,
} from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";

// ============================================================================
// Types
// ============================================================================

export interface ResearchAreaStats {
  publicationCount: number;
  memberCount: number;
}

export interface ResearchAreaListItem {
  id: string;
  slug: string;
  title: string;
  keywords: string | null;
  content: string | null;
  parentId: string | null;
  order: number;
  isHidden: boolean;
  stats: ResearchAreaStats;
}

export interface ResearchAreaWithChildren extends ResearchAreaListItem {
  children: ResearchAreaListItem[];
}

export interface ResearchAreaFull {
  id: string;
  slug: string;
  title: string;
  keywords: string | null;
  content: string | null;
  parentId: string | null;
  order: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParentOption {
  id: string;
  title: string;
}

// ============================================================================
// Schemas (Extended)
// ============================================================================

const updateResearchAreaSchema = researchAreaSchema.extend({
  id: idSchema,
});

const deleteResearchAreaSchema = z.object({
  id: idSchema,
});

const toggleHiddenSchema = z.object({
  id: idSchema,
  isHidden: z.boolean(),
});

const reorderWithParentSchema = reorderSchema.extend({
  parentId: z.string().nullable().optional(),
});

// ============================================================================
// Stats Calculation
// ============================================================================

/**
 * Calculate statistics for multiple research areas in a batch.
 */
async function calculateStatsBatch(
  areaIds: string[]
): Promise<Map<string, ResearchAreaStats>> {
  if (areaIds.length === 0) {
    return new Map();
  }

  const [publicationCounts, memberCounts] = await Promise.all([
    prisma.publicationResearchArea.groupBy({
      by: ["researchAreaId"],
      where: { researchAreaId: { in: areaIds } },
      _count: { _all: true },
    }),
    prisma.memberResearchArea.groupBy({
      by: ["researchAreaId"],
      where: { researchAreaId: { in: areaIds } },
      _count: { _all: true },
    }),
  ]);

  // Build maps for quick lookup
  const pubCountByArea = new Map<string, number>();
  for (const row of publicationCounts) {
    pubCountByArea.set(row.researchAreaId, row._count._all);
  }

  const memberCountByArea = new Map<string, number>();
  for (const row of memberCounts) {
    memberCountByArea.set(row.researchAreaId, row._count._all);
  }

  // Build result map
  const result = new Map<string, ResearchAreaStats>();
  for (const id of areaIds) {
    result.set(id, {
      publicationCount: pubCountByArea.get(id) ?? 0,
      memberCount: memberCountByArea.get(id) ?? 0,
    });
  }

  return result;
}

/**
 * Calculate aggregated stats for a parent including all children.
 */
async function calculateAggregatedStats(
  parentId: string,
  childIds: string[]
): Promise<ResearchAreaStats> {
  const allIds = [parentId, ...childIds];

  const [publicationCount, memberCount] = await Promise.all([
    prisma.publicationResearchArea.count({
      where: { researchAreaId: { in: allIds } },
    }),
    prisma.memberResearchArea.count({
      where: { researchAreaId: { in: allIds } },
    }),
  ]);

  return { publicationCount, memberCount };
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all research areas as a hierarchical tree.
 */
export const getResearchAreasTree = createAction(
  async (): Promise<ResearchAreaWithChildren[]> => {
    // Fetch all research areas
    const allAreas = await prisma.researchArea.findMany({
      orderBy: { order: "asc" },
    });

    // Separate into parents and children
    const parentAreas = allAreas.filter((a) => !a.parentId);
    const childrenMap = new Map<string, typeof allAreas>();

    for (const area of allAreas) {
      if (area.parentId) {
        const siblings = childrenMap.get(area.parentId) || [];
        siblings.push(area);
        childrenMap.set(area.parentId, siblings);
      }
    }

    // Calculate stats for all areas
    const allIds = allAreas.map((a) => a.id);
    const statsBatch = await calculateStatsBatch(allIds);

    // Build hierarchy with stats
    const result: ResearchAreaWithChildren[] = [];

    for (const parent of parentAreas) {
      const children = childrenMap.get(parent.id) || [];
      const childIds = children.map((c) => c.id);

      // Child stats from batch
      const childrenWithStats: ResearchAreaListItem[] = children.map(
        (child) => ({
          id: child.id,
          slug: child.slug,
          title: child.title,
          keywords: child.keywords,
          content: child.content,
          parentId: child.parentId,
          order: child.order,
          isHidden: child.isHidden,
          stats: statsBatch.get(child.id) ?? {
            publicationCount: 0,
            memberCount: 0,
          },
        })
      );

      // Parent stats (aggregated with children)
      const stats =
        childIds.length > 0
          ? await calculateAggregatedStats(parent.id, childIds)
          : (statsBatch.get(parent.id) ?? {
              publicationCount: 0,
              memberCount: 0,
            });

      result.push({
        id: parent.id,
        slug: parent.slug,
        title: parent.title,
        keywords: parent.keywords,
        content: parent.content,
        parentId: parent.parentId,
        order: parent.order,
        isHidden: parent.isHidden,
        stats,
        children: childrenWithStats,
      });
    }

    return result;
  }
);

/**
 * Get all top-level research areas for parent selection dropdown.
 */
export const getParentOptions = createAction(
  async (): Promise<ParentOption[]> => {
    const areas = await prisma.researchArea.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    });
    return areas;
  }
);

/**
 * Get a single research area by ID.
 */
export const getResearchAreaById = createSafeAction(
  z.object({ id: idSchema }),
  async (data): Promise<ResearchAreaFull> => {
    const area = await prisma.researchArea.findUnique({
      where: { id: data.id },
    });

    if (!area) {
      throw new ActionError("Research area not found");
    }

    return area;
  }
);

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new research area at the end of the order within its level.
 */
export const createResearchArea = createSafeAction(
  researchAreaSchema,
  async (data): Promise<ResearchAreaFull> => {
    // Check for slug uniqueness
    const existing = await prisma.researchArea.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ActionError("A research area with this slug already exists");
    }

    // Validate parent if provided
    if (data.parentId) {
      const parent = await prisma.researchArea.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new ActionError("Parent research area not found");
      }

      // Ensure parent is not a child (max 2 levels)
      if (parent.parentId) {
        throw new ActionError(
          "Cannot create a sub-area under another sub-area (max 2 levels)"
        );
      }
    }

    // Get the maximum order value within this level
    const maxOrder = await prisma.researchArea.aggregate({
      where: { parentId: data.parentId ?? null },
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    // Create research area
    const area = await prisma.researchArea.create({
      data: {
        slug: data.slug,
        title: data.title,
        keywords: data.keywords
          ? JSON.stringify(
              Array.isArray(data.keywords) ? data.keywords : [data.keywords]
            )
          : null,
        content: data.content,
        parentId: data.parentId,
        isHidden: data.isHidden ?? false,
        order: newOrder,
      },
    });

    return area;
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an existing research area.
 */
export const updateResearchArea = createSafeAction(
  updateResearchAreaSchema,
  async (data): Promise<ResearchAreaFull> => {
    // Get existing area with children
    const existing = await prisma.researchArea.findUnique({
      where: { id: data.id },
      include: { children: { select: { id: true } } },
    });

    if (!existing) {
      throw new ActionError("Research area not found");
    }

    // Check slug uniqueness if changed
    if (data.slug !== existing.slug) {
      const duplicate = await prisma.researchArea.findUnique({
        where: { slug: data.slug },
      });

      if (duplicate) {
        throw new ActionError("A research area with this slug already exists");
      }
    }

    // Validate parent change
    if (data.parentId !== existing.parentId) {
      // Can't be your own parent
      if (data.parentId === data.id) {
        throw new ActionError("A research area cannot be its own parent");
      }

      // Can't move parent with children to become a child
      if (data.parentId && existing.children.length > 0) {
        throw new ActionError(
          "Cannot move a parent area with children to become a sub-area. " +
            "Move or remove children first."
        );
      }

      // Validate new parent
      if (data.parentId) {
        const newParent = await prisma.researchArea.findUnique({
          where: { id: data.parentId },
        });

        if (!newParent) {
          throw new ActionError("Parent research area not found");
        }

        // Ensure new parent is not a child (max 2 levels)
        if (newParent.parentId) {
          throw new ActionError(
            "Cannot create a sub-area under another sub-area (max 2 levels)"
          );
        }
      }
    }

    // Update research area
    const area = await prisma.researchArea.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        title: data.title,
        keywords: data.keywords
          ? JSON.stringify(
              Array.isArray(data.keywords) ? data.keywords : [data.keywords]
            )
          : null,
        content: data.content,
        parentId: data.parentId,
        isHidden: data.isHidden,
      },
    });

    return area;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a research area.
 * Fails if area has children.
 */
export const deleteResearchArea = createSafeAction(
  deleteResearchAreaSchema,
  async (data): Promise<void> => {
    const area = await prisma.researchArea.findUnique({
      where: { id: data.id },
      include: {
        children: { select: { id: true } },
      },
    });

    if (!area) {
      throw new ActionError("Research area not found");
    }

    // Check for children
    if (area.children.length > 0) {
      throw new ActionError(
        `Cannot delete "${area.title}" because it has ${area.children.length} sub-area(s). ` +
          "Delete or move sub-areas first."
      );
    }

    // Delete research area (cascade will handle junction tables)
    await prisma.researchArea.delete({
      where: { id: data.id },
    });
  }
);

// ============================================================================
// Toggle Hidden Operation
// ============================================================================

/**
 * Toggle research area visibility.
 */
export const toggleResearchAreaHidden = createSafeAction(
  toggleHiddenSchema,
  async (data): Promise<ResearchAreaListItem> => {
    const area = await prisma.researchArea.update({
      where: { id: data.id },
      data: { isHidden: data.isHidden },
    });

    // Get stats for the updated area
    const statsBatch = await calculateStatsBatch([area.id]);
    const stats = statsBatch.get(area.id) ?? {
      publicationCount: 0,
      memberCount: 0,
    };

    return {
      id: area.id,
      slug: area.slug,
      title: area.title,
      keywords: area.keywords,
      content: area.content,
      parentId: area.parentId,
      order: area.order,
      isHidden: area.isHidden,
      stats,
    };
  }
);

// ============================================================================
// Reorder Operation
// ============================================================================

/**
 * Reorder research areas within the same parent level.
 */
export const reorderResearchAreas = createSafeAction(
  reorderWithParentSchema,
  async (data): Promise<void> => {
    // Verify all areas belong to this parent level
    const areas = await prisma.researchArea.findMany({
      where: { id: { in: data.items.map((i) => i.id) } },
      select: { id: true, parentId: true },
    });

    const invalidArea = areas.find(
      (a) => (a.parentId ?? null) !== (data.parentId ?? null)
    );

    if (invalidArea) {
      throw new ActionError(
        "Cannot reorder areas across different parent levels"
      );
    }

    // Update all in a transaction
    await prisma.$transaction(
      data.items.map(({ id, order }) =>
        prisma.researchArea.update({
          where: { id },
          data: { order },
        })
      )
    );
  }
);
