/**
 * Publication Database Queries
 *
 * Centralized queries for publication-related data operations.
 * Optimized for both list views (with filtering) and detail pages.
 */

import { prisma } from "@/lib/db/client";
import { getYear, getCurrentYear, startOfYear, endOfYear } from "@/lib/date";
import type {
  PublicationListItem,
  PublicationDetail,
  PublicationFilters,
} from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface PublicationStats {
  totalPublications: number;
  totalCitations: number;
  yearRange: { min: number; max: number };
}

export interface FilterOptions {
  years: number[];
  journals: string[];
  researchAreas: { id: string; slug: string; title: string }[];
}

// ============================================================================
// List Queries
// ============================================================================

/**
 * Get all publications with optional filtering.
 * Returns publications sorted by date (newest first).
 */
export async function getPublications(
  filters?: PublicationFilters
): Promise<PublicationListItem[]> {
  const where = buildWhereClause(filters);

  return prisma.publication.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      members: {
        include: {
          member: {
            select: { id: true, name: true, photo: true },
          },
        },
      },
      researchAreas: {
        include: {
          researchArea: {
            select: { id: true, slug: true, title: true },
          },
        },
      },
    },
  });
}

/**
 * Get all publications for static page generation.
 * Lighter query without relations.
 */
export async function getAllPublicationDois(): Promise<string[]> {
  const publications = await prisma.publication.findMany({
    select: { doi: true },
  });
  return publications.map((p) => p.doi);
}

// ============================================================================
// Detail Queries
// ============================================================================

/**
 * Get a single publication by DOI with full relations.
 */
export async function getPublicationByDoi(
  doi: string
): Promise<PublicationDetail | null> {
  return prisma.publication.findUnique({
    where: { doi },
    include: {
      members: {
        include: {
          member: {
            select: { id: true, name: true, photo: true, position: true },
          },
        },
      },
      researchAreas: {
        include: {
          researchArea: {
            select: { id: true, slug: true, title: true },
          },
        },
      },
    },
  });
}

// ============================================================================
// Statistics & Metadata
// ============================================================================

/**
 * Get overall publication statistics.
 */
export async function getPublicationStats(): Promise<PublicationStats> {
  const [countResult, citationResult, dateRange] = await Promise.all([
    prisma.publication.count(),
    prisma.publication.aggregate({
      _sum: { citations: true },
    }),
    prisma.publication.aggregate({
      _min: { date: true },
      _max: { date: true },
    }),
  ]);

  const currentYear = getCurrentYear();
  const minYear = dateRange._min.date
    ? getYear(dateRange._min.date)
    : currentYear;
  const maxYear = dateRange._max.date
    ? getYear(dateRange._max.date)
    : currentYear;

  return {
    totalPublications: countResult,
    totalCitations: citationResult._sum.citations ?? 0,
    yearRange: { min: minYear, max: maxYear },
  };
}

/**
 * Get available filter options based on existing data.
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  const [yearsResult, journalsResult, areasResult] = await Promise.all([
    // Get all dates for year extraction
    prisma.publication.findMany({
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    // Get distinct journals
    prisma.publication.findMany({
      where: { journal: { not: null } },
      select: { journal: true },
      distinct: ["journal"],
      orderBy: { journal: "asc" },
    }),
    // Get research areas that have publications
    prisma.researchArea.findMany({
      where: {
        publications: { some: {} },
        isHidden: false,
      },
      select: { id: true, slug: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  // Extract unique years
  const yearsSet = new Set<number>();
  for (const pub of yearsResult) {
    yearsSet.add(getYear(pub.date));
  }
  const years = Array.from(yearsSet).sort((a, b) => b - a);

  // Extract unique journals
  const journals = journalsResult
    .map((p) => p.journal)
    .filter((j): j is string => j !== null);

  return {
    years,
    journals,
    researchAreas: areasResult,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build Prisma where clause from filters.
 */
function buildWhereClause(filters?: PublicationFilters) {
  if (!filters) return {};

  const where: Record<string, unknown> = {};

  // Year filter
  if (filters.year) {
    const yearStart = startOfYear(filters.year);
    const yearEnd = endOfYear(filters.year);
    where.date = {
      gte: yearStart,
      lte: yearEnd,
    };
  }

  // Journal filter
  if (filters.journal) {
    where.journal = filters.journal;
  }

  // Research area filter
  if (filters.researchAreaId) {
    where.researchAreas = {
      some: { researchAreaId: filters.researchAreaId },
    };
  }

  // Member filter
  if (filters.memberId) {
    where.members = {
      some: { memberId: filters.memberId },
    };
  }

  // Search filter (title, authors, abstract)
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { authors: { contains: filters.search } },
      { abstract: { contains: filters.search } },
    ];
  }

  return where;
}
