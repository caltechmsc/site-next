/**
 * Research Area Database Queries
 *
 * Centralized queries for research area data operations.
 * Supports hierarchical structure with parent/child relationships.
 */

import { prisma } from "@/lib/db/client";
import type {
  ResearchAreaWithStats,
  ResearchAreaWithHierarchy,
  ResearchAreaDetail,
  ResearchAreaStats,
} from "@/types";

// ============================================================================
// Batched Stats Calculation
// ============================================================================

/**
 * Calculate statistics for multiple research areas in a single batch.
 */
async function calculateStatsBatch(
  areaIds: string[]
): Promise<Map<string, ResearchAreaStats>> {
  if (areaIds.length === 0) {
    return new Map();
  }

  const [publicationCounts, memberCounts, citationRows] = await Promise.all([
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
    prisma.publicationResearchArea.findMany({
      where: { researchAreaId: { in: areaIds } },
      select: {
        researchAreaId: true,
        publication: { select: { citations: true } },
      },
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

  const citationsByArea = new Map<string, number>();
  for (const row of citationRows) {
    const prev = citationsByArea.get(row.researchAreaId) ?? 0;
    citationsByArea.set(row.researchAreaId, prev + row.publication.citations);
  }

  // Build result map
  const result = new Map<string, ResearchAreaStats>();
  for (const id of areaIds) {
    result.set(id, {
      publicationCount: pubCountByArea.get(id) ?? 0,
      memberCount: memberCountByArea.get(id) ?? 0,
      totalCitations: citationsByArea.get(id) ?? 0,
    });
  }

  return result;
}

/**
 * Calculate aggregated stats for a parent including all children.
 * Uses publication DOIs for proper deduplication.
 */
async function calculateStatsWithChildren(
  researchAreaId: string,
  childIds: string[]
): Promise<ResearchAreaStats> {
  const allIds = [researchAreaId, ...childIds];

  const [publicationCount, memberCount, citations] = await Promise.all([
    prisma.publicationResearchArea.count({
      where: { researchAreaId: { in: allIds } },
    }),
    prisma.memberResearchArea.count({
      where: { researchAreaId: { in: allIds } },
    }),
    prisma.publicationResearchArea.findMany({
      where: { researchAreaId: { in: allIds } },
      select: {
        publicationDoi: true,
        publication: { select: { citations: true } },
      },
    }),
  ]);

  // Deduplicate by publication DOI (a publication might be in parent and child)
  const uniquePublications = new Map<string, number>();
  for (const { publicationDoi, publication } of citations) {
    if (!uniquePublications.has(publicationDoi)) {
      uniquePublications.set(publicationDoi, publication.citations);
    }
  }
  const totalCitations = Array.from(uniquePublications.values()).reduce(
    (sum, c) => sum + c,
    0
  );

  return { publicationCount, memberCount, totalCitations };
}

// ============================================================================
// List Queries
// ============================================================================

/**
 * Get all top-level research areas with their children.
 * Returns hierarchical structure suitable for nested card display.
 */
export async function getResearchAreasHierarchy(): Promise<
  ResearchAreaWithHierarchy[]
> {
  // Fetch all research areas in one query
  const allAreas = await prisma.researchArea.findMany({
    where: { isHidden: false },
    orderBy: { order: "asc" },
    include: {
      parent: { select: { id: true, slug: true, title: true } },
      members: {
        select: {
          member: { select: { id: true, name: true, photo: true } },
        },
      },
    },
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

  // Batch calculate stats for all child areas
  const allChildIds = allAreas.filter((a) => a.parentId).map((a) => a.id);
  const childStatsBatch = await calculateStatsBatch(allChildIds);

  // Build hierarchy with stats
  const result: ResearchAreaWithHierarchy[] = [];

  for (const parent of parentAreas) {
    const children = childrenMap.get(parent.id) || [];
    const childIds = children.map((c) => c.id);

    // Assign pre-calculated stats to children
    const childrenWithStats: ResearchAreaWithStats[] = children.map(
      (child) => ({
        ...child,
        stats: childStatsBatch.get(child.id) ?? {
          publicationCount: 0,
          memberCount: 0,
          totalCitations: 0,
        },
      })
    );

    // Calculate aggregated stats for parent (including children)
    const stats = await calculateStatsWithChildren(parent.id, childIds);

    result.push({
      ...parent,
      children: childrenWithStats,
      stats,
    });
  }

  return result;
}

/**
 * Get all research area slugs for static generation.
 */
export async function getAllResearchAreaSlugs(): Promise<string[]> {
  const areas = await prisma.researchArea.findMany({
    where: { isHidden: false },
    select: { slug: true },
  });
  return areas.map((a) => a.slug);
}

// ============================================================================
// Detail Queries
// ============================================================================

/**
 * Get a research area by slug with full details.
 */
export async function getResearchAreaBySlug(
  slug: string
): Promise<ResearchAreaDetail | null> {
  const area = await prisma.researchArea.findUnique({
    where: { slug },
    include: {
      parent: { select: { id: true, slug: true, title: true } },
      children: {
        where: { isHidden: false },
        orderBy: { order: "asc" },
      },
      members: {
        select: {
          member: {
            select: { id: true, name: true, photo: true, position: true },
          },
        },
      },
      publications: {
        select: {
          publication: {
            include: {
              members: {
                select: { member: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { publication: { date: "desc" } },
      },
    },
  });

  if (!area || area.isHidden) {
    return null;
  }

  // Batch calculate stats for all children and own area
  const childIds = area.children.map((c) => c.id);
  const allIds = [area.id, ...childIds];
  const statsBatch = await calculateStatsBatch(allIds);

  // Assign stats to children
  const childrenWithStats = area.children.map((child) => ({
    ...child,
    stats: statsBatch.get(child.id) ?? {
      publicationCount: 0,
      memberCount: 0,
      totalCitations: 0,
    },
  }));

  // Get own stats from batch
  const stats = statsBatch.get(area.id) ?? {
    publicationCount: 0,
    memberCount: 0,
    totalCitations: 0,
  };

  return {
    ...area,
    children: childrenWithStats,
    stats,
  };
}

/**
 * Get breadcrumb path for a research area.
 */
export async function getResearchAreaBreadcrumb(
  slug: string
): Promise<Array<{ slug: string; title: string }>> {
  const area = await prisma.researchArea.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      parent: { select: { slug: true, title: true } },
    },
  });

  if (!area) return [];

  const breadcrumb: Array<{ slug: string; title: string }> = [];

  if (area.parent) {
    breadcrumb.push({ slug: area.parent.slug, title: area.parent.title });
  }

  breadcrumb.push({ slug: area.slug, title: area.title });

  return breadcrumb;
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get overall statistics for all research areas.
 */
export async function getResearchAreasOverallStats(): Promise<{
  totalAreas: number;
  totalPublications: number;
  totalCitations: number;
}> {
  const [totalAreas, publicationsData] = await Promise.all([
    prisma.researchArea.count({ where: { isHidden: false } }),
    prisma.publication.aggregate({
      _count: true,
      _sum: { citations: true },
    }),
  ]);

  return {
    totalAreas,
    totalPublications: publicationsData._count,
    totalCitations: publicationsData._sum.citations ?? 0,
  };
}
