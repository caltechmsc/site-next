/**
 * Sync Server Actions
 *
 * Read-only queries for sync page statistics.
 * Actual sync operations happen via the SSE API endpoint.
 */

"use server";

import { prisma } from "@/lib/db/client";
import { createAction } from "./utils";

// ============================================================================
// Types
// ============================================================================

export interface SyncStats {
  /** Total publications with DOIs (eligible for metadata sync) */
  publicationsWithDoi: number;
  /** Total publications */
  publicationsTotal: number;
  /** Publications that have been synced at least once */
  publicationsSynced: number;
  /** Publications that have never been synced */
  publicationsUnsynced: number;
  /** Most recent sync timestamp (or null if never synced) */
  lastSyncedAt: string | null;
  /** Current relationship counts */
  relationships: {
    pubMember: number;
    pubArea: number;
    memberArea: number;
  };
  /** Entity counts relevant to relationship building */
  entities: {
    members: number;
    researchAreas: number;
    researchAreasWithKeywords: number;
  };
}

// ============================================================================
// Read Operation
// ============================================================================

/**
 * Get sync-related statistics for the admin sync page.
 */
export const getSyncStats = createAction(async (): Promise<SyncStats> => {
  const [
    publicationsTotal,
    publicationsWithDoi,
    publicationsSynced,
    lastSynced,
    pubMemberCount,
    pubAreaCount,
    memberAreaCount,
    memberCount,
    researchAreaCount,
    allAreas,
  ] = await Promise.all([
    prisma.publication.count(),
    prisma.publication.count({ where: { doi: { not: null } } }),
    prisma.publication.count({ where: { lastSyncedAt: { not: null } } }),
    prisma.publication.findFirst({
      where: { lastSyncedAt: { not: null } },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
    prisma.memberPublication.count(),
    prisma.publicationResearchArea.count(),
    prisma.memberResearchArea.count(),
    prisma.member.count(),
    prisma.researchArea.count({ where: { isHidden: false } }),
    prisma.researchArea.findMany({
      where: { isHidden: false },
      select: { keywords: true },
    }),
  ]);

  // Count areas that have at least one keyword
  const researchAreasWithKeywords = allAreas.filter((a) => {
    if (!a.keywords) return false;
    try {
      const parsed = JSON.parse(a.keywords);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }).length;

  return {
    publicationsWithDoi,
    publicationsTotal,
    publicationsSynced,
    publicationsUnsynced: publicationsWithDoi - publicationsSynced,
    lastSyncedAt: lastSynced?.lastSyncedAt?.toISOString() ?? null,
    relationships: {
      pubMember: pubMemberCount,
      pubArea: pubAreaCount,
      memberArea: memberAreaCount,
    },
    entities: {
      members: memberCount,
      researchAreas: researchAreaCount,
      researchAreasWithKeywords,
    },
  };
});
