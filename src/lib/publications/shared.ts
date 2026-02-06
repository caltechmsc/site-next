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

// ============================================================================
// Constants
// ============================================================================

/** Request timeout for DOI API calls (10 seconds) */
export const REQUEST_TIMEOUT = 10_000;

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
