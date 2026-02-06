/**
 * DOI Lookup Service
 *
 * Unified interface for looking up publication metadata by DOI.
 * Tries OpenAlex first, falls back to Crossref.
 */

import { fetchFromOpenAlex } from "./openalex";
import { fetchFromCrossref } from "./crossref";

// ============================================================================
// Types
// ============================================================================

export interface DoiLookupResult {
  title: string;
  authors: string[];
  abstract: string | null;
  date: string; // ISO date: "YYYY-MM-DD"
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  /** Which API returned the result */
  source: "openalex" | "crossref";
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Look up publication metadata by DOI.
 */
export async function lookupDoi(doi: string): Promise<DoiLookupResult | null> {
  // Normalize DOI
  const normalizedDoi = doi
    .trim()
    .replace(/^https?:\/\/doi\.org\//, "")
    .replace(/^doi:/, "");

  if (!normalizedDoi) return null;

  // Try OpenAlex first
  const openAlexResult = await fetchFromOpenAlex(normalizedDoi);
  if (openAlexResult) {
    return { ...openAlexResult, source: "openalex" };
  }

  // Fall back to Crossref
  const crossrefResult = await fetchFromCrossref(normalizedDoi);
  if (crossrefResult) {
    return { ...crossrefResult, source: "crossref" };
  }

  return null;
}
