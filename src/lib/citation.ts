/**
 * Citation Format Utilities
 *
 * Generate formatted citations in various academic styles.
 * Supports APA, MLA, and BibTeX formats.
 */

import { getYear } from "@/lib/date";

// ============================================================================
// Types
// ============================================================================

export interface CitationData {
  doi: string | null;
  title: string;
  authors: string[];
  date: string; // ISO date string: YYYY-MM-DD
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
}

export type CitationFormat = "apa" | "mla" | "bibtex";

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate citation in specified format.
 */
export function formatCitation(
  data: CitationData,
  format: CitationFormat
): string {
  switch (format) {
    case "apa":
      return formatAPA(data);
    case "mla":
      return formatMLA(data);
    case "bibtex":
      return formatBibTeX(data);
    default:
      return formatAPA(data);
  }
}

/**
 * Get all citation formats for a publication.
 */
export function getAllCitationFormats(
  data: CitationData
): Record<CitationFormat, string> {
  return {
    apa: formatAPA(data),
    mla: formatMLA(data),
    bibtex: formatBibTeX(data),
  };
}

// ============================================================================
// Format Implementations
// ============================================================================

/**
 * APA 7th Edition format
 * Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, Volume(Issue), Pages. https://doi.org/xxx
 */
function formatAPA(data: CitationData): string {
  const authors = data.authors;
  const year = getYear(data.date);

  // Format authors: "Last, F. M., & Last, F. M."
  const formattedAuthors = formatAuthorsAPA(authors);

  // Build citation parts
  const parts: string[] = [];

  parts.push(`${formattedAuthors} (${year}).`);
  parts.push(`${data.title}.`);

  if (data.journal) {
    let journalPart = `*${data.journal}*`;
    if (data.volume) {
      journalPart += `, *${data.volume}*`;
      if (data.issue) {
        journalPart += `(${data.issue})`;
      }
    }
    if (data.pages) {
      journalPart += `, ${data.pages}`;
    }
    journalPart += ".";
    parts.push(journalPart);
  }

  if (data.doi) {
    parts.push(`https://doi.org/${data.doi}`);
  }

  return parts.join(" ");
}

/**
 * MLA 9th Edition format
 * Author. "Title of Article." Journal Name, vol. X, no. X, Year, pp. X-X. DOI.
 */
function formatMLA(data: CitationData): string {
  const authors = data.authors;
  const year = getYear(data.date);

  // Format authors: "Last, First, and First Last"
  const formattedAuthors = formatAuthorsMLA(authors);

  // Build citation parts
  const parts: string[] = [];

  parts.push(`${formattedAuthors}.`);
  parts.push(`"${data.title}."`);

  if (data.journal) {
    let journalPart = `*${data.journal}*`;
    const details: string[] = [];

    if (data.volume) {
      details.push(`vol. ${data.volume}`);
    }
    if (data.issue) {
      details.push(`no. ${data.issue}`);
    }
    details.push(year.toString());
    if (data.pages) {
      details.push(`pp. ${data.pages}`);
    }

    if (details.length > 0) {
      journalPart += ", " + details.join(", ");
    }
    journalPart += ".";
    parts.push(journalPart);
  }

  if (data.doi) {
    parts.push(`https://doi.org/${data.doi}`);
  }

  return parts.join(" ");
}

/**
 * BibTeX format
 */
function formatBibTeX(data: CitationData): string {
  const authors = data.authors;
  const year = getYear(data.date);

  // Generate citation key: FirstAuthorLastName + Year
  const citationKey = generateBibTeXKey(authors[0] || "Unknown", year);

  // Format authors: "Last, First and Last, First"
  const formattedAuthors = authors
    .map((author) => {
      const parts = author.split(" ");
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(" ");
        return `${lastName}, ${firstName}`;
      }
      return author;
    })
    .join(" and ");

  // Collect fields, then join with commas (no trailing comma on last field)
  const fields: string[] = [
    `  author = {${formattedAuthors}}`,
    `  title = {${data.title}}`,
  ];

  if (data.journal) fields.push(`  journal = {${data.journal}}`);
  if (data.volume) fields.push(`  volume = {${data.volume}}`);
  if (data.issue) fields.push(`  number = {${data.issue}}`);
  if (data.pages) fields.push(`  pages = {${data.pages}}`);

  fields.push(`  year = {${year}}`);
  if (data.doi) fields.push(`  doi = {${data.doi}}`);

  return [`@article{${citationKey},`, fields.join(",\n"), "}"].join("\n");
}

// ============================================================================
// Author Formatting Helpers
// ============================================================================

/**
 * Format authors for APA style.
 * "Last, F. M., Last, F. M., & Last, F. M."
 */
function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) {
    return "Unknown";
  }

  const formatted = authors.map((author) => {
    const parts = author
      .trim()
      .split(" ")
      .filter((p) => p.length > 0);
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1];
      const initials = parts
        .slice(0, -1)
        .map((p) => `${p[0]}.`)
        .join(" ");
      return `${lastName}, ${initials}`;
    }
    return author || "Unknown";
  });

  if (formatted.length === 1) {
    return formatted[0];
  }
  if (formatted.length === 2) {
    return `${formatted[0]} & ${formatted[1]}`;
  }
  // 3+ authors
  const last = formatted.pop();
  return `${formatted.join(", ")}, & ${last}`;
}

/**
 * Format authors for MLA style.
 * "Last, First, et al." for 3+ authors
 * "Last, First, and First Last" for 2 authors
 */
function formatAuthorsMLA(authors: string[]): string {
  if (authors.length === 0) {
    return "Unknown";
  }

  const formatFirst = (author: string) => {
    const parts = author.trim().split(" ");
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(" ");
      return `${lastName}, ${firstName}`;
    }
    return author;
  };

  if (authors.length === 1) {
    return formatFirst(authors[0]);
  }
  if (authors.length === 2) {
    return `${formatFirst(authors[0])}, and ${authors[1]}`;
  }
  // 3+ authors: use "et al."
  return `${formatFirst(authors[0])}, et al.`;
}

/**
 * Generate a BibTeX citation key.
 */
function generateBibTeXKey(author: string, year: number): string {
  const parts = author.trim().split(" ");
  const lastName = parts[parts.length - 1] || "Unknown";
  // Remove non-alphanumeric characters
  const cleanName = lastName.replace(/[^a-zA-Z]/g, "");
  return `${cleanName.toLowerCase()}${year}`;
}
