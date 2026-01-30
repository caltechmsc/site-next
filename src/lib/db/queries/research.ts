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
// Stats Calculation
// ============================================================================

/**
 * Calculate aggregated statistics for a research area.
 */
async function calculateStats(
  researchAreaId: string
): Promise<ResearchAreaStats> {
  const [publicationCount, memberCount, citations] = await Promise.all([
    prisma.publicationResearchArea.count({
      where: { researchAreaId },
    }),
    prisma.memberResearchArea.count({
      where: { researchAreaId },
    }),
    prisma.publicationResearchArea.findMany({
      where: { researchAreaId },
      select: { publication: { select: { citations: true } } },
    }),
  ]);

  const totalCitations = citations.reduce(
    (sum, { publication }) => sum + publication.citations,
    0
  );

  return { publicationCount, memberCount, totalCitations };
}

/**
 * Calculate aggregated stats including children.
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
      select: { publication: { select: { citations: true } } },
    }),
  ]);

  // Deduplicate citations (a publication might be in parent and child)
  const uniqueCitations = new Set(
    citations.map((c) => c.publication.citations)
  );
  const totalCitations = Array.from(uniqueCitations).reduce(
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

  // Build hierarchy with stats
  const result: ResearchAreaWithHierarchy[] = [];

  for (const parent of parentAreas) {
    const children = childrenMap.get(parent.id) || [];
    const childIds = children.map((c) => c.id);

    // Calculate stats for each child
    const childrenWithStats: ResearchAreaWithStats[] = await Promise.all(
      children.map(async (child) => ({
        ...child,
        stats: await calculateStats(child.id),
      }))
    );

    // Calculate aggregated stats for parent (including children)
    const stats = await calculateStatsWithChildren(parent.id, childIds);

    result.push({
      ...parent,
      children: childrenWithStats,
      stats,
    });
  }

  // Also include standalone areas (no parent, no children)

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

  // Calculate stats for children
  const childrenWithStats = await Promise.all(
    area.children.map(async (child) => ({
      ...child,
      stats: await calculateStats(child.id),
    }))
  );

  // Calculate own stats
  const stats = await calculateStats(area.id);

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
