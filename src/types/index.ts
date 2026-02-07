/**
 * Common Type Definitions
 *
 * Shared TypeScript types used across the application.
 * Extends Prisma types with relation data where needed.
 */

import type {
  Member,
  MemberCategory,
  Publication,
  ResearchArea,
  Collaborator,
  GroupPhoto,
  Admin,
} from "@prisma/client";

// ============================================================================
// Extended Prisma Types (with Relations)
// ============================================================================

/** Member with all related data */
export type MemberWithRelations = Member & {
  category: MemberCategory;
  publications: { publication: Publication }[];
  researchAreas: { researchArea: ResearchArea }[];
};

/** Member with category only (for list views) */
export type MemberWithCategory = Member & {
  category: MemberCategory;
};

/** Publication with all related data */
export type PublicationWithRelations = Publication & {
  members: { member: Member }[];
  researchAreas: { researchArea: ResearchArea }[];
};

/** Publication with member names (for display) */
export type PublicationWithMembers = Publication & {
  members: { member: Pick<Member, "id" | "name"> }[];
};

/** Publication for list display (with related members) */
export type PublicationListItem = Publication & {
  members: { member: Pick<Member, "id" | "name" | "photo"> }[];
  researchAreas: {
    researchArea: Pick<ResearchArea, "id" | "slug" | "title">;
  }[];
};

/** Publication detail (full data) */
export type PublicationDetail = Publication & {
  members: { member: Pick<Member, "id" | "name" | "photo" | "position"> }[];
  researchAreas: {
    researchArea: Pick<ResearchArea, "id" | "slug" | "title">;
  }[];
};

/** Research area with hierarchy and counts */
export type ResearchAreaWithRelations = ResearchArea & {
  parent: ResearchArea | null;
  children: ResearchArea[];
  _count: {
    publications: number;
    members: number;
  };
};

/** Research area with nested children and aggregated stats */
export type ResearchAreaWithHierarchy = ResearchArea & {
  parent: Pick<ResearchArea, "id" | "slug" | "title"> | null;
  children: ResearchAreaWithStats[];
  stats: ResearchAreaStats;
  members: { member: Pick<Member, "id" | "name" | "photo"> }[];
};

/** Research area with stats (for cards) */
export type ResearchAreaWithStats = ResearchArea & {
  stats: ResearchAreaStats;
  members: { member: Pick<Member, "id" | "name" | "photo"> }[];
};

/** Aggregated statistics for a research area */
export type ResearchAreaStats = {
  publicationCount: number;
  memberCount: number;
  totalCitations: number;
};

/** Research area with full detail for detail page */
export type ResearchAreaDetail = ResearchArea & {
  parent: Pick<ResearchArea, "id" | "slug" | "title"> | null;
  children: (ResearchArea & { stats: ResearchAreaStats })[];
  members: {
    member: Pick<Member, "id" | "name" | "photo" | "position">;
  }[];
  publications: {
    publication: Publication & {
      members: { member: Pick<Member, "id" | "name"> }[];
    };
  }[];
  stats: ResearchAreaStats;
};

// ============================================================================
// Filter & Sort Types
// ============================================================================

/** Publication list filters */
export type PublicationFilters = {
  year?: number;
  journal?: string;
  researchAreaId?: string;
  memberId?: string;
  search?: string;
};

// ============================================================================
// Re-exports (for convenience)
// ============================================================================

export type {
  Member,
  MemberCategory,
  Publication,
  ResearchArea,
  Collaborator,
  GroupPhoto,
  Admin,
};
