/**
 * DOI Lookup Service
 *
 * Unified interface for looking up publication metadata by DOI.
 * Tries OpenAlex first, falls back to Crossref.
 */

import { type PublicationMetadata, normalizeDoi } from "./shared";
import { fetchFromOpenAlex } from "./openalex";
import { fetchFromCrossref } from "./crossref";

// ============================================================================
// Types
// ============================================================================

export interface DoiLookupResult extends PublicationMetadata {
  /** Which API returned the result */
  source: "openalex" | "crossref";
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Look up publication metadata by DOI.
 *
 * Tries OpenAlex first (faster, open), then falls back to Crossref.
 */
export async function lookupDoi(doi: string): Promise<DoiLookupResult | null> {
  const normalized = normalizeDoi(doi);
  if (!normalized) return null;

  // Try OpenAlex first
  const openAlexResult = await fetchFromOpenAlex(normalized);
  if (openAlexResult) {
    return { ...openAlexResult, source: "openalex" };
  }

  // Fall back to Crossref
  const crossrefResult = await fetchFromCrossref(normalized);
  if (crossrefResult) {
    return { ...crossrefResult, source: "crossref" };
  }

  return null;
}
