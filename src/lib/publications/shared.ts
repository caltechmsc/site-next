/**
 * Shared Utilities for DOI API Clients
 */

// ============================================================================
// Types
// ============================================================================

/** Publication metadata returned by any DOI API */
export interface PublicationMetadata {
  title: string;
  authors: string[];
  abstract: string | null;
  date: string; // ISO format: "YYYY-MM-DD"
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
}

/** Author info with ORCID */
export interface AuthorInfo {
  name: string;
  orcid: string | null;
}

/** Dynamic data fetched during sync */
export interface SyncMetadata {
  /** Total citation count */
  citations: number;
  /** Filtered keywords (score >= threshold) */
  keywords: string[];
  /** Author list with ORCID identifiers */
  authors: AuthorInfo[];
}

// ============================================================================
// Constants
// ============================================================================

/** Request timeout for DOI API calls (10 seconds) */
export const REQUEST_TIMEOUT = 10_000;

/** Delay between API requests during sync (ms, polite-pool) */
export const SYNC_DELAY = 150;

/** Minimum keyword relevance score to include */
export const MIN_KEYWORD_SCORE = 0.3;

/**
 * Polite-pool headers for academic API requests.
 */
export const POLITE_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "MSC-Website/1.0 (mailto:wag@caltech.edu)",
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Normalize a DOI string by stripping common prefixes.
 */
export function normalizeDoi(doi: string): string {
  return doi
    .trim()
    .replace(/^https?:\/\/doi\.org\//, "")
    .replace(/^doi:/i, "");
}
