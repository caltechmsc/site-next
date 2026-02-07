/**
 * Relationship Matching Engine
 *
 * Algorithms for building data relationships between publications,
 * members, and research areas. Uses multi-signal matching to minimize
 * both false positives and false negatives.
 */

import type { AuthorInfo } from "./shared";

// ============================================================================
// Types
// ============================================================================

/** Member data needed for matching */
export interface MatchableMember {
  id: string;
  name: string;
  aliases: string[]; // Parsed from JSON
  orcid: string | null;
}

/** Research area data needed for matching */
export interface MatchableResearchArea {
  id: string;
  keywords: string[]; // Parsed from JSON
}

/** Publication data needed for matching */
export interface MatchablePublication {
  id: string;
  title: string;
  authors: string[]; // Parsed from JSON
  topics: string[]; // Parsed from JSON (synced from OpenAlex)
  syncAuthors: AuthorInfo[]; // From OpenAlex (with ORCIDs)
}

// ============================================================================
// Publication ↔ Member Matching
// ============================================================================

/**
 * Match a publication to members using multi-signal strategy.
 *
 * Priority order (short-circuits on ORCID match):
 *   1. ORCID exact match (highest confidence)
 *   2. Full name exact match (case-insensitive)
 *   3. Alias match (publication author ∈ member aliases)
 *   4. Last-name + first-initial match (fuzzy fallback)
 */
export function matchPublicationToMembers(
  publication: MatchablePublication,
  members: MatchableMember[]
): string[] {
  const matchedIds = new Set<string>();

  for (const member of members) {
    if (isMemberMatch(publication, member)) {
      matchedIds.add(member.id);
    }
  }

  return Array.from(matchedIds);
}

/** Check if a single member matches a publication */
function isMemberMatch(
  pub: MatchablePublication,
  member: MatchableMember
): boolean {
  // Signal 1: ORCID exact match (strongest signal)
  if (member.orcid && pub.syncAuthors.length > 0) {
    const orcidMatch = pub.syncAuthors.some(
      (a) => a.orcid !== null && a.orcid === member.orcid
    );
    if (orcidMatch) return true;
  }

  // Build normalized name lists for text matching
  const pubAuthorNames = [
    ...pub.authors.map(normalizeName),
    ...pub.syncAuthors.map((a) => normalizeName(a.name)),
  ];

  const memberNames = [
    normalizeName(member.name),
    ...member.aliases.map(normalizeName),
  ];

  // Signal 2: Full name exact match
  for (const pubName of pubAuthorNames) {
    for (const memberName of memberNames) {
      if (pubName === memberName) return true;
    }
  }

  // Signal 3: Last-name + first-initial match
  const memberTokenSets = memberNames.map(extractNameTokens);
  const pubTokenSets = pubAuthorNames.map(extractNameTokens);

  for (const pubTokens of pubTokenSets) {
    if (!pubTokens) continue;
    for (const memberTokens of memberTokenSets) {
      if (!memberTokens) continue;
      if (isLastNameInitialMatch(pubTokens, memberTokens)) return true;
    }
  }

  return false;
}

// ============================================================================
// Publication ↔ Research Area Matching
// ============================================================================

/**
 * Match a publication to research areas using keyword intersection.
 *
 * Combines two high-precision text signals from the publication:
 *   - Synced topics/keywords (from OpenAlex, pre-filtered by score)
 *   - Title tokens (always available, compact)
 *
 * Abstract text is intentionally excluded — it contains incidental
 * mentions of neighboring fields that cause false positives.
 *
 * Matching is forward-only: area keywords are searched within
 * publication tokens. The reverse direction (pub token inside area
 * keyword) is not used to prevent common short words like "field"
 * from matching multi-word keywords like "force field".
 */
export function matchPublicationToAreas(
  publication: MatchablePublication,
  areas: MatchableResearchArea[]
): string[] {
  // Build publication token set from all text signals
  const pubTokens = buildPublicationTokens(publication);

  const matchedIds: string[] = [];

  for (const area of areas) {
    if (isAreaMatch(pubTokens, area.keywords)) {
      matchedIds.push(area.id);
    }
  }

  return matchedIds;
}

/**
 * Check if any area keyword appears in the publication token set.
 *
 * Forward-only substring: area keyword → pub token.
 * This correctly handles pluralization ("simulation" ⊂ "simulations")
 * while preventing false matches ("field" ⊄ "force field").
 */
function isAreaMatch(pubTokens: Set<string>, areaKeywords: string[]): boolean {
  for (const keyword of areaKeywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (!normalizedKeyword) continue;

    // Exact token match (handles multi-word keywords like "force field")
    if (pubTokens.has(normalizedKeyword)) return true;

    // Forward substring: area keyword found within a pub token.
    // Only for keywords >= 3 chars to prevent ultra-short matches.
    // Examples: "simulation" in "simulations", "DFT" in "dft-based"
    if (normalizedKeyword.length >= 3) {
      for (const token of pubTokens) {
        if (token.includes(normalizedKeyword)) return true;
      }
    }
  }

  return false;
}

/**
 * Build a token set from high-precision publication text signals.
 *
 * Sources:
 *   1. OpenAlex keywords (pre-filtered by score ≥ 0.3, most reliable)
 *   2. Title tokens (always available, compact and precise)
 *
 * Abstract is intentionally excluded: it often mentions neighboring
 * fields in passing (e.g., "quantum chemical calculations" in a
 * ReaxFF paper), causing false positives for area classification.
 */
function buildPublicationTokens(pub: MatchablePublication): Set<string> {
  const tokens = new Set<string>();

  // Source 1: Synced keywords (highest quality — already filtered by score)
  for (const keyword of pub.topics) {
    tokens.add(keyword.toLowerCase().trim());
  }

  // Source 2: Title tokens (precise, always available)
  for (const token of tokenizeText(pub.title)) {
    tokens.add(token);
  }

  return tokens;
}

// ============================================================================
// Name Normalization Utilities
// ============================================================================

/** Tokens extracted from a name for fuzzy matching */
interface NameTokens {
  lastName: string;
  firstInitial: string;
}

/**
 * Normalize a name for comparison.
 * Strips accents, lowercases, removes suffixes (III, Jr, etc.).
 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip accents
    .toLowerCase()
    .replace(/\b(iii|ii|iv|jr|sr)\.?\b/g, "") // Remove suffixes
    .replace(/[^a-z\s]/g, " ") // Remove non-alpha except spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract structured name tokens for fuzzy matching.
 *
 * Handles common academic name formats:
 *   - "William A. Goddard III" → { lastName: "goddard", firstInitial: "w" }
 *   - "W.A. Goddard" → { lastName: "goddard", firstInitial: "w" }
 *   - "Adri C. T. van Duin" → { lastName: "duin", firstInitial: "a" }
 */
function extractNameTokens(name: string): NameTokens | null {
  const normalized = normalizeName(name);
  const parts = normalized.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length < 2) return null;

  const lastName = parts[parts.length - 1];
  const firstInitial = parts[0][0];

  return { lastName, firstInitial };
}

/**
 * Check if two name token sets match via last-name + first-initial.
 */
function isLastNameInitialMatch(a: NameTokens, b: NameTokens): boolean {
  return a.lastName === b.lastName && a.firstInitial === b.firstInitial;
}

// ============================================================================
// Text Tokenization
// ============================================================================

/** Common stop words to exclude from text tokenization */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "we",
  "our",
  "their",
  "not",
  "no",
  "using",
  "based",
  "via",
  "new",
  "study",
  "between",
  "through",
  "into",
  "over",
  "under",
  "about",
  "more",
  "than",
  "very",
  "also",
  "such",
  "both",
  "each",
  "all",
  "any",
  "most",
  "other",
  "some",
  "only",
]);

/**
 * Tokenize text into meaningful words for matching.
 * Strips punctuation, lowercases, removes stop words and short tokens.
 */
function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}
