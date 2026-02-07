/**
 * DOI Sync Service
 *
 * Unified interface for fetching dynamic publication data by DOI.
 * Tries OpenAlex first (rich data), falls back to CrossRef (citations only).
 */

import { type SyncMetadata, normalizeDoi } from "./shared";
import { fetchSyncFromOpenAlex } from "./openalex";
import { fetchCitationsFromCrossref } from "./crossref";

// ============================================================================
// Types
// ============================================================================

export interface DoiSyncResult extends SyncMetadata {
  /** Which API returned the result */
  source: "openalex" | "crossref";
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch dynamic publication data by DOI for sync purposes.
 *
 * OpenAlex provides the richest data (citations + keywords + author ORCIDs).
 * CrossRef is a fallback that only provides citation count.
 */
export async function syncDoi(doi: string): Promise<DoiSyncResult | null> {
  const normalized = normalizeDoi(doi);
  if (!normalized) return null;

  // Try OpenAlex first
  const openAlexResult = await fetchSyncFromOpenAlex(normalized);
  if (openAlexResult) {
    return { ...openAlexResult, source: "openalex" };
  }

  // Fall back to CrossRef
  const citations = await fetchCitationsFromCrossref(normalized);
  if (citations !== null) {
    return {
      citations,
      keywords: [],
      authors: [],
      source: "crossref",
    };
  }

  return null;
}
