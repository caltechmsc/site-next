/**
 * Dashboard Server Actions
 *
 * Aggregated data queries for the admin dashboard.
 * All queries run in parallel for optimal performance.
 */

"use server";

import { prisma } from "@/lib/db/client";
import { createAction } from "./utils";

// ============================================================================
// Types
// ============================================================================

export interface PublicationByYear {
  year: string;
  count: number;
  cumulative: number;
}

export interface RecentMember {
  id: string;
  name: string;
  photo: string | null;
  position: string | null;
  categoryName: string;
}

export interface RecentPublication {
  id: string;
  index: number;
  doi: string | null;
  title: string;
  authors: string;
  journal: string | null;
  date: string;
}

export interface DashboardData {
  stats: {
    members: { total: number; visible: number; hidden: number };
    publications: { total: number; totalCitations: number };
    researchAreas: { total: number; topLevel: number };
    collaborators: { total: number; countries: number };
    photos: { total: number };
    admins: { total: number };
  };
  publicationsByYear: PublicationByYear[];
  recentMembers: RecentMember[];
  recentPublications: RecentPublication[];
}

// ============================================================================
// Constants
// ============================================================================

/** Number of recent items to display on the dashboard */
const RECENT_ITEMS_LIMIT = 5;

// ============================================================================
// Read Operation
// ============================================================================

/**
 * Get aggregated dashboard statistics.
 * Runs all queries in parallel for optimal load time.
 */
export const getDashboardStats = createAction(
  async (): Promise<DashboardData> => {
    const [
      totalMembers,
      hiddenMembers,
      totalPublications,
      citationsAggregate,
      totalResearchAreas,
      topLevelResearchAreas,
      totalCollaborators,
      uniqueCountries,
      totalPhotos,
      totalAdmins,
      publicationDates,
      recentMembersRaw,
      recentPublicationsRaw,
    ] = await Promise.all([
      // Member counts
      prisma.member.count(),
      prisma.member.count({ where: { isHidden: true } }),

      // Publication aggregates
      prisma.publication.count(),
      prisma.publication.aggregate({ _sum: { citations: true } }),

      // Research area counts
      prisma.researchArea.count(),
      prisma.researchArea.count({ where: { parentId: null } }),

      // Collaborator data
      prisma.collaborator.count(),
      prisma.collaborator.findMany({
        where: { country: { not: null } },
        distinct: ["country"],
        select: { country: true },
      }),

      // Other counts
      prisma.groupPhoto.count(),
      prisma.admin.count(),

      // Publication dates for chart
      prisma.publication.findMany({
        select: { date: true },
        orderBy: { date: "asc" },
      }),

      // Recent members
      prisma.member.findMany({
        take: RECENT_ITEMS_LIMIT,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          photo: true,
          position: true,
          category: { select: { name: true } },
        },
      }),

      // Recent publications
      prisma.publication.findMany({
        take: RECENT_ITEMS_LIMIT,
        orderBy: { date: "desc" },
        select: {
          id: true,
          index: true,
          doi: true,
          title: true,
          authors: true,
          journal: true,
          date: true,
        },
      }),
    ]);

    // --------------------------------------------------------------------------
    // Process publications by year
    // --------------------------------------------------------------------------

    const yearCounts = new Map<string, number>();
    for (const pub of publicationDates) {
      const year = pub.date.substring(0, 4);
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }

    let cumulative = 0;
    const publicationsByYear = Array.from(yearCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => {
        cumulative += count;
        return { year, count, cumulative };
      });

    // --------------------------------------------------------------------------
    // Format recent items
    // --------------------------------------------------------------------------

    const recentMembers: RecentMember[] = recentMembersRaw.map((m) => ({
      id: m.id,
      name: m.name,
      photo: m.photo,
      position: m.position,
      categoryName: m.category.name,
    }));

    const recentPublications: RecentPublication[] = recentPublicationsRaw.map(
      (p) => ({
        id: p.id,
        index: p.index,
        doi: p.doi,
        title: p.title,
        authors: p.authors,
        journal: p.journal,
        date: p.date,
      })
    );

    // --------------------------------------------------------------------------
    // Assemble response
    // --------------------------------------------------------------------------

    return {
      stats: {
        members: {
          total: totalMembers,
          visible: totalMembers - hiddenMembers,
          hidden: hiddenMembers,
        },
        publications: {
          total: totalPublications,
          totalCitations: citationsAggregate._sum.citations ?? 0,
        },
        researchAreas: {
          total: totalResearchAreas,
          topLevel: topLevelResearchAreas,
        },
        collaborators: {
          total: totalCollaborators,
          countries: uniqueCountries.length,
        },
        photos: {
          total: totalPhotos,
        },
        admins: {
          total: totalAdmins,
        },
      },
      publicationsByYear,
      recentMembers,
      recentPublications,
    };
  }
);
