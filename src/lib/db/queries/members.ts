/**
 * Member Database Queries
 *
 * Centralized queries for member-related data operations.
 * All queries return typed data with proper relations.
 */

import { prisma } from "@/lib/db/client";
import type {
  MemberWithCategory,
  MemberWithRelations,
  PublicationWithMembers,
} from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface CategoryWithMembers {
  id: string;
  name: string;
  order: number;
  showByDefault: boolean;
  members: MemberWithCategory[];
}

// ============================================================================
// List Queries
// ============================================================================

/**
 * Get all categories with their members.
 * Categories sorted by order, members sorted by order within each category.
 * Only returns categories that have visible members.
 */
export async function getCategoriesWithMembers(): Promise<
  CategoryWithMembers[]
> {
  const categories = await prisma.memberCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      members: {
        where: { isHidden: false },
        orderBy: { order: "asc" },
        include: {
          category: true,
        },
      },
    },
  });

  // Filter out empty categories
  return categories.filter((cat) => cat.members.length > 0);
}

/**
 * Get all members with their categories.
 * For simple list views without full relations.
 */
export async function getAllMembers(): Promise<MemberWithCategory[]> {
  return prisma.member.findMany({
    where: { isHidden: false },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
    include: {
      category: true,
    },
  });
}

// ============================================================================
// Detail Queries
// ============================================================================

/**
 * Get a single member with all related data.
 * Includes category, publications, and research areas.
 */
export async function getMemberById(
  id: string
): Promise<MemberWithRelations | null> {
  return prisma.member.findUnique({
    where: { id },
    include: {
      category: true,
      publications: {
        include: {
          publication: true,
        },
      },
      researchAreas: {
        include: {
          researchArea: true,
        },
      },
    },
  });
}

/**
 * Get member's publication statistics.
 * Returns total count, citation sum, and yearly distribution.
 */
export async function getMemberPublicationStats(memberId: string) {
  const publications = await prisma.publication.findMany({
    where: {
      members: {
        some: { memberId },
      },
    },
    select: {
      date: true,
      citations: true,
    },
  });

  // Calculate total citations
  const totalCitations = publications.reduce(
    (sum, pub) => sum + pub.citations,
    0
  );

  // Calculate yearly distribution
  const yearlyDistribution = publications.reduce(
    (acc, pub) => {
      const year = pub.date.getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  // Get year range
  const years = Object.keys(yearlyDistribution)
    .map(Number)
    .sort((a, b) => a - b);
  const minYear = years[0] || new Date().getFullYear();
  const maxYear = years[years.length - 1] || new Date().getFullYear();

  return {
    totalPublications: publications.length,
    totalCitations,
    yearlyDistribution,
    yearRange: { min: minYear, max: maxYear },
  };
}

/**
 * Get member's publications sorted by date.
 * Used for the publications list on member detail page.
 */
export async function getMemberPublications(
  memberId: string
): Promise<PublicationWithMembers[]> {
  return prisma.publication.findMany({
    where: {
      members: {
        some: { memberId },
      },
    },
    orderBy: { date: "desc" },
    include: {
      members: {
        include: {
          member: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

// ============================================================================
// Static Generation Helpers
// ============================================================================

/**
 * Get all member IDs for static path generation.
 */
export async function getAllMemberIds(): Promise<string[]> {
  const members = await prisma.member.findMany({
    where: { isHidden: false },
    select: { id: true },
  });
  return members.map((m) => m.id);
}
