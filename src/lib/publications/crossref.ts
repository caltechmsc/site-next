/**
 * Crossref API Client
 *
 * Fetches publication metadata from Crossref (https://www.crossref.org).
 */

import {
  type PublicationMetadata,
  normalizeDoi,
  POLITE_HEADERS,
  REQUEST_TIMEOUT,
} from "./shared";

// ============================================================================
// Types
// ============================================================================

/** Relevant subset of a Crossref Work message */
interface CrossrefWork {
  title: string[];
  author?: {
    given?: string;
    family?: string;
    name?: string;
    sequence: string;
  }[];
  abstract?: string;
  "published-print"?: { "date-parts": number[][] };
  "published-online"?: { "date-parts": number[][] };
  "container-title"?: string[];
  volume?: string;
  issue?: string;
  page?: string;
}

/** Top-level Crossref API response envelope */
interface CrossrefResponse {
  status: string;
  message: CrossrefWork;
}

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = "https://api.crossref.org";

// ============================================================================
// Public API
// ============================================================================

/** Fetch publication metadata from Crossref by DOI */
export async function fetchFromCrossref(
  doi: string
): Promise<PublicationMetadata | null> {
  try {
    const url = buildUrl(doi);
    const response = await fetch(url, {
      headers: POLITE_HEADERS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`Crossref API error: ${response.status}`);
      return null;
    }

    const data: CrossrefResponse = await response.json();
    return parseWork(data.message);
  } catch (error) {
    console.error("Crossref fetch failed:", error);
    return null;
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Build the API URL for a DOI lookup */
function buildUrl(doi: string): string {
  const normalized = normalizeDoi(doi);
  return `${BASE_URL}/works/${encodeURIComponent(normalized)}`;
}

/** Parse a Crossref Work message into common result format */
function parseWork(work: CrossrefWork): PublicationMetadata {
  const title = work.title?.[0] ?? "Untitled";

  const authors = (work.author ?? []).map((a) => {
    if (a.name) return a.name;
    const parts = [a.given, a.family].filter(Boolean);
    return parts.join(" ") || "Unknown";
  });

  const abstract = work.abstract ?? null;
  const date = extractDate(work);
  const journal = work["container-title"]?.[0] ?? null;

  return {
    title,
    authors,
    abstract,
    date,
    journal,
    volume: work.volume ?? null,
    issue: work.issue ?? null,
    pages: work.page ?? null,
  };
}

/** Extract the best available publication date */
function extractDate(work: CrossrefWork): string {
  const dateParts =
    work["published-print"]?.["date-parts"]?.[0] ??
    work["published-online"]?.["date-parts"]?.[0];

  if (!dateParts || dateParts.length === 0) return "1970-01-01";

  const [year, month = 1, day = 1] = dateParts;
  return [
    year.toString(),
    month.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}
