/**
 * Publication Sync Engine
 *
 * Orchestrates metadata synchronization and relationship rebuilding.
 * Supports three modes: metadata-only, relationships-only, and full sync.
 */

import { prisma } from "@/lib/db/client";
import { syncDoi, SYNC_DELAY } from "./index";
import {
  matchPublicationToMembers,
  matchPublicationToAreas,
  type MatchableMember,
  type MatchableResearchArea,
  type MatchablePublication,
} from "./matching";
import type { AuthorInfo } from "./shared";

// ============================================================================
// Types
// ============================================================================

/** Sync operation mode */
export type SyncMode = "metadata" | "relationships" | "full";

/** Progress event types for SSE streaming */
export type SyncEvent =
  | { type: "phase"; phase: "metadata" | "relationships"; total: number }
  | { type: "progress"; current: number; total: number; label: string }
  | {
      type: "item-done";
      index: number;
      doi: string;
      status: "ok" | "skip" | "error";
      detail?: string;
    }
  | {
      type: "relationships-built";
      pubMember: number;
      pubArea: number;
      memberArea: number;
    }
  | { type: "complete"; summary: SyncSummary }
  | { type: "error"; message: string };

/** Final sync summary */
export interface SyncSummary {
  metadata: {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
  } | null;
  relationships: {
    pubMember: number;
    pubArea: number;
    memberArea: number;
  } | null;
  durationMs: number;
}

/** Callback for emitting progress events */
export type SyncProgressCallback = (event: SyncEvent) => void;

// ============================================================================
// Global Lock
// ============================================================================

let isSyncing = false;

/** Check if a sync operation is currently running */
export function isSyncRunning(): boolean {
  return isSyncing;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Run a sync operation.
 */
export async function runSync(
  mode: SyncMode,
  onProgress: SyncProgressCallback
): Promise<void> {
  if (isSyncing) {
    onProgress({
      type: "error",
      message: "A sync operation is already running",
    });
    return;
  }

  isSyncing = true;
  const startTime = Date.now();

  const summary: SyncSummary = {
    metadata: null,
    relationships: null,
    durationMs: 0,
  };

  try {
    // Phase 1: Metadata sync
    if (mode === "metadata" || mode === "full") {
      summary.metadata = await syncMetadata(onProgress);
    }

    // Phase 2: Relationship rebuild
    if (mode === "relationships" || mode === "full") {
      summary.relationships = await rebuildRelationships(onProgress);
    }

    summary.durationMs = Date.now() - startTime;
    onProgress({ type: "complete", summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    onProgress({ type: "error", message });
  } finally {
    isSyncing = false;
  }
}

// ============================================================================
// Phase 1: Metadata Sync
// ============================================================================

/**
 * Fetch and update dynamic metadata for all publications with DOIs.
 *
 * For each publication:
 *   1. Call OpenAlex (rich data) → CrossRef fallback (citations only)
 *   2. Update citations, topics, and lastSyncedAt in the database
 *   3. Store author info temporarily for Phase 2 ORCID matching
 */
async function syncMetadata(
  onProgress: SyncProgressCallback
): Promise<SyncSummary["metadata"]> {
  // Query all publications with DOIs
  const publications = await prisma.publication.findMany({
    where: { doi: { not: null } },
    select: { id: true, index: true, doi: true, title: true },
    orderBy: { index: "asc" },
  });

  const total = publications.length;
  onProgress({ type: "phase", phase: "metadata", total });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Clear cached author data from previous run
  syncAuthorCache.clear();

  for (let i = 0; i < publications.length; i++) {
    const pub = publications[i];
    const doi = pub.doi!;

    onProgress({
      type: "progress",
      current: i + 1,
      total,
      label: `#${pub.index}: ${truncate(pub.title, 50)}`,
    });

    try {
      const result = await syncDoi(doi);

      if (!result) {
        skipped++;
        onProgress({
          type: "item-done",
          index: pub.index,
          doi,
          status: "skip",
          detail: "Not found in OpenAlex or CrossRef",
        });
      } else {
        // Update database
        await prisma.publication.update({
          where: { id: pub.id },
          data: {
            citations: result.citations,
            topics:
              result.keywords.length > 0
                ? JSON.stringify(result.keywords)
                : null,
            lastSyncedAt: new Date(),
          },
        });

        // Cache author info for relationship building
        if (result.authors.length > 0) {
          syncAuthorCache.set(pub.id, result.authors);
        }

        updated++;
        onProgress({
          type: "item-done",
          index: pub.index,
          doi,
          status: "ok",
          detail: `${result.citations} citations, ${result.keywords.length} keywords (${result.source})`,
        });
      }
    } catch {
      failed++;
      onProgress({
        type: "item-done",
        index: pub.index,
        doi,
        status: "error",
        detail: "API request failed",
      });
    }

    // Polite delay between requests
    if (i < publications.length - 1) {
      await delay(SYNC_DELAY);
    }
  }

  return { total, updated, skipped, failed };
}

// ============================================================================
// Phase 2: Relationship Rebuild
// ============================================================================

/**
 * Rebuild all three relationship tables in a single transaction.
 *
 * Process:
 *   1. Load all members, research areas, and publications
 *   2. Match Publication ↔ Member (ORCID → name → alias → initial)
 *   3. Match Publication ↔ ResearchArea (keyword intersection)
 *   4. Derive Member ↔ ResearchArea from the above two
 *   5. Clear and re-insert all relationships atomically
 */
async function rebuildRelationships(
  onProgress: SyncProgressCallback
): Promise<SyncSummary["relationships"]> {
  // Load all entities
  const [rawMembers, rawAreas, rawPublications] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, name: true, aliases: true, orcid: true },
    }),
    prisma.researchArea.findMany({
      where: { isHidden: false },
      select: { id: true, keywords: true },
    }),
    prisma.publication.findMany({
      select: {
        id: true,
        title: true,
        authors: true,
        topics: true,
      },
    }),
  ]);

  // Parse JSON fields into matchable format
  const members: MatchableMember[] = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    aliases: parseJsonArray(m.aliases),
    orcid: m.orcid,
  }));

  const areas: MatchableResearchArea[] = rawAreas
    .map((a) => ({
      id: a.id,
      keywords: parseJsonArray(a.keywords),
    }))
    .filter((a) => a.keywords.length > 0); // Skip areas without keywords

  const publications: MatchablePublication[] = rawPublications.map((p) => ({
    id: p.id,
    title: p.title,
    authors: parseJsonArray(p.authors),
    topics: parseJsonArray(p.topics),
    syncAuthors: syncAuthorCache.get(p.id) ?? [],
  }));

  const total = publications.length;
  onProgress({ type: "phase", phase: "relationships", total });

  // Build all relationships
  const pubMemberLinks: { publicationId: string; memberId: string }[] = [];
  const pubAreaLinks: { publicationId: string; researchAreaId: string }[] = [];
  const memberAreaSet = new Map<string, Set<string>>(); // memberId → Set<areaId>

  for (let i = 0; i < publications.length; i++) {
    const pub = publications[i];

    onProgress({
      type: "progress",
      current: i + 1,
      total,
      label: `Matching: ${truncate(pub.title, 50)}`,
    });

    // Publication ↔ Member
    const matchedMemberIds = matchPublicationToMembers(pub, members);
    for (const memberId of matchedMemberIds) {
      pubMemberLinks.push({ publicationId: pub.id, memberId });
    }

    // Publication ↔ ResearchArea
    const matchedAreaIds = matchPublicationToAreas(pub, areas);
    for (const areaId of matchedAreaIds) {
      pubAreaLinks.push({ publicationId: pub.id, researchAreaId: areaId });
    }

    // Derive Member ↔ ResearchArea
    for (const memberId of matchedMemberIds) {
      for (const areaId of matchedAreaIds) {
        if (!memberAreaSet.has(memberId)) {
          memberAreaSet.set(memberId, new Set());
        }
        memberAreaSet.get(memberId)!.add(areaId);
      }
    }
  }

  // Flatten derived member-area relationships
  const memberAreaLinks: { memberId: string; researchAreaId: string }[] = [];
  for (const [memberId, areaIds] of memberAreaSet) {
    for (const researchAreaId of areaIds) {
      memberAreaLinks.push({ memberId, researchAreaId });
    }
  }

  // Atomic transaction: clear all → re-insert all
  await prisma.$transaction(async (tx) => {
    // Clear existing relationships
    await tx.memberResearchArea.deleteMany({});
    await tx.publicationResearchArea.deleteMany({});
    await tx.memberPublication.deleteMany({});

    // Batch insert (Prisma createMany with skipDuplicates for safety)
    if (pubMemberLinks.length > 0) {
      await tx.memberPublication.createMany({
        data: pubMemberLinks,
      });
    }

    if (pubAreaLinks.length > 0) {
      await tx.publicationResearchArea.createMany({
        data: pubAreaLinks,
      });
    }

    if (memberAreaLinks.length > 0) {
      await tx.memberResearchArea.createMany({
        data: memberAreaLinks,
      });
    }
  });

  const result = {
    pubMember: pubMemberLinks.length,
    pubArea: pubAreaLinks.length,
    memberArea: memberAreaLinks.length,
  };

  onProgress({ type: "relationships-built", ...result });

  return result;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * In-memory cache of OpenAlex author data from Phase 1.
 * Used in Phase 2 for ORCID-based member matching.
 * Cleared at the start of each metadata sync.
 */
const syncAuthorCache = new Map<string, AuthorInfo[]>();

/** Parse a JSON string array, returning empty array on failure */
function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

/** Truncate a string to max length with ellipsis */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/** Async delay */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
