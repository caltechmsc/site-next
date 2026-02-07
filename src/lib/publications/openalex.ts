/**
 * OpenAlex API Client
 *
 * Fetches publication metadata from OpenAlex (https://openalex.org).
 */

import { env } from "@/config/env";

import {
  type PublicationMetadata,
  type SyncMetadata,
  normalizeDoi,
  POLITE_HEADERS,
  REQUEST_TIMEOUT,
  MIN_KEYWORD_SCORE,
} from "./shared";

// ============================================================================
// Types
// ============================================================================

/** Relevant subset of an OpenAlex Work object */
interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string;
  publication_date: string | null;
  cited_by_count: number;
  authorships: {
    author: { display_name: string; orcid: string | null };
    author_position: string;
  }[];
  primary_location: {
    source: { display_name: string } | null;
  } | null;
  biblio: {
    volume: string | null;
    issue: string | null;
    first_page: string | null;
    last_page: string | null;
  };
  abstract_inverted_index: Record<string, number[]> | null;
  keywords: { display_name: string; score: number }[];
}

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = "https://api.openalex.org";

// ============================================================================
// Public API
// ============================================================================

/** Fetch publication metadata from OpenAlex by DOI */
export async function fetchFromOpenAlex(
  doi: string
): Promise<PublicationMetadata | null> {
  try {
    const work = await fetchWork(doi);
    if (!work) return null;
    return parseWork(work);
  } catch (error) {
    console.error("OpenAlex fetch failed:", error);
    return null;
  }
}

/**
 * Fetch dynamic sync data from OpenAlex by DOI.
 */
export async function fetchSyncFromOpenAlex(
  doi: string
): Promise<SyncMetadata | null> {
  try {
    const work = await fetchWork(doi);
    if (!work) return null;
    return parseSyncData(work);
  } catch (error) {
    console.error("OpenAlex sync fetch failed:", error);
    return null;
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Fetch raw Work object from OpenAlex API */
async function fetchWork(doi: string): Promise<OpenAlexWork | null> {
  const url = buildUrl(doi);
  const response = await fetch(url, {
    headers: POLITE_HEADERS,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    console.error(`OpenAlex API error: ${response.status}`);
    return null;
  }

  return response.json();
}

/** Build the API URL for a DOI lookup */
function buildUrl(doi: string): string {
  const normalized = normalizeDoi(doi);
  const params = new URLSearchParams();

  if (env.OPENALEX_API_KEY) {
    params.set("api_key", env.OPENALEX_API_KEY);
  }

  const query = params.toString();
  return `${BASE_URL}/works/doi:${normalized}${query ? `?${query}` : ""}`;
}

/** Parse an OpenAlex Work into common result format */
function parseWork(work: OpenAlexWork): PublicationMetadata {
  const authors = work.authorships.map((a) => a.author.display_name);

  const abstract = work.abstract_inverted_index
    ? reconstructAbstract(work.abstract_inverted_index)
    : null;

  const date = work.publication_date ?? "1970-01-01";
  const journal = work.primary_location?.source?.display_name ?? null;
  const pages = formatPages(work.biblio.first_page, work.biblio.last_page);

  return {
    title: work.title,
    authors,
    abstract,
    date,
    journal,
    volume: work.biblio.volume,
    issue: work.biblio.issue,
    pages,
  };
}

/**
 * Reconstruct abstract text from OpenAlex inverted index format.
 *
 * The inverted index maps each word to its position(s) in the text.
 * Reverse this to rebuild the original sentence order.
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: [number, string][] = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }

  words.sort((a, b) => a[0] - b[0]);
  return words.map(([, word]) => word).join(" ");
}

/** Format page range from first/last page */
function formatPages(
  firstPage: string | null,
  lastPage: string | null
): string | null {
  if (!firstPage) return null;
  if (!lastPage || firstPage === lastPage) return firstPage;
  return `${firstPage}-${lastPage}`;
}

/** Parse sync-relevant data from an OpenAlex Work */
function parseSyncData(work: OpenAlexWork): SyncMetadata {
  const keywords = work.keywords
    .filter((kw) => kw.score >= MIN_KEYWORD_SCORE)
    .map((kw) => kw.display_name);

  const authors = work.authorships.map((a) => ({
    name: a.author.display_name,
    orcid: normalizeOrcid(a.author.orcid),
  }));

  return {
    citations: work.cited_by_count,
    keywords,
    authors,
  };
}

/**
 * Normalize ORCID to bare format (0000-0000-0000-0000).
 * OpenAlex returns full URL: https://orcid.org/0000-...
 */
function normalizeOrcid(orcid: string | null): string | null {
  if (!orcid) return null;
  return orcid.replace(/^https?:\/\/orcid\.org\//, "");
}
