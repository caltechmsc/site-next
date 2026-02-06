/**
 * Publication Server Actions
 *
 * CRUD operations for publications with continuous index management.
 * Includes DOI auto-fill via OpenAlex/Crossref and distinct value helpers.
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import {
  publicationSchema,
  doiLookupSchema,
  reorderSchema,
  idSchema,
} from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";
import { lookupDoi, type DoiLookupResult } from "@/lib/publications";

// ============================================================================
// Types
// ============================================================================

export interface PublicationListItem {
  id: string;
  index: number;
  doi: string | null;
  title: string;
  authors: string;
  date: string;
  journal: string | null;
  citations: number;
  createdAt: Date;
}

export interface PublicationFull {
  id: string;
  index: number;
  doi: string | null;
  title: string;
  authors: string;
  abstract: string | null;
  date: string;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  topics: string | null;
  citations: number;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schemas (Extended)
// ============================================================================

const updatePublicationSchema = publicationSchema.extend({
  id: idSchema,
});

const deletePublicationSchema = z.object({
  id: idSchema,
});

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all publications ordered by index (descending — highest index first).
 */
export const getPublications = createAction(
  async (): Promise<PublicationListItem[]> => {
    const publications = await prisma.publication.findMany({
      orderBy: { index: "desc" },
      select: {
        id: true,
        index: true,
        doi: true,
        title: true,
        authors: true,
        date: true,
        journal: true,
        citations: true,
        createdAt: true,
      },
    });

    return publications;
  }
);

/**
 * Get a single publication by ID with full details.
 */
export const getPublicationById = createSafeAction(
  z.object({ id: idSchema }),
  async (data): Promise<PublicationFull> => {
    const publication = await prisma.publication.findUnique({
      where: { id: data.id },
    });

    if (!publication) {
      throw new ActionError("Publication not found");
    }

    return publication;
  }
);

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new publication at the next available index (end of list).
 * Stores authors as a JSON array string.
 */
export const createPublication = createSafeAction(
  publicationSchema,
  async (data): Promise<PublicationFull> => {
    // Check DOI uniqueness if provided
    if (data.doi) {
      const existing = await prisma.publication.findUnique({
        where: { doi: data.doi },
      });
      if (existing) {
        throw new ActionError(
          `A publication with DOI "${data.doi}" already exists (index #${existing.index})`
        );
      }
    }

    // Get next index (max + 1)
    const maxIndex = await prisma.publication.aggregate({
      _max: { index: true },
    });
    const nextIndex = (maxIndex._max.index ?? 0) + 1;

    // Create publication
    const publication = await prisma.publication.create({
      data: {
        index: nextIndex,
        doi: data.doi || null,
        title: data.title,
        authors: JSON.stringify(data.authors),
        abstract: data.abstract || null,
        date: data.date,
        journal: data.journal || null,
        volume: data.volume || null,
        issue: data.issue || null,
        pages: data.pages || null,
      },
    });

    return publication;
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an existing publication.
 */
export const updatePublication = createSafeAction(
  updatePublicationSchema,
  async (data): Promise<PublicationFull> => {
    const existing = await prisma.publication.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new ActionError("Publication not found");
    }

    // Check DOI uniqueness if changed and provided
    if (data.doi && data.doi !== existing.doi) {
      const duplicate = await prisma.publication.findUnique({
        where: { doi: data.doi },
      });
      if (duplicate) {
        throw new ActionError(
          `A publication with DOI "${data.doi}" already exists (index #${duplicate.index})`
        );
      }
    }

    // Update publication
    const publication = await prisma.publication.update({
      where: { id: data.id },
      data: {
        doi: data.doi || null,
        title: data.title,
        authors: JSON.stringify(data.authors),
        abstract: data.abstract || null,
        date: data.date,
        journal: data.journal || null,
        volume: data.volume || null,
        issue: data.issue || null,
        pages: data.pages || null,
      },
    });

    return publication;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a publication and compact indices to maintain continuity.
 * Uses a transaction to ensure atomicity.
 */
export const deletePublication = createSafeAction(
  deletePublicationSchema,
  async (data): Promise<void> => {
    const publication = await prisma.publication.findUnique({
      where: { id: data.id },
      select: { id: true, index: true, title: true },
    });

    if (!publication) {
      throw new ActionError("Publication not found");
    }

    // Delete and compact indices in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete the publication (cascades to junction tables)
      await tx.publication.delete({
        where: { id: publication.id },
      });

      // 2. Decrement index for all publications with higher index
      await tx.publication.updateMany({
        where: { index: { gt: publication.index } },
        data: { index: { decrement: 1 } },
      });
    });
  }
);

// ============================================================================
// Reorder Operation
// ============================================================================

/**
 * Reorder publications by reassigning indices.
 */
export const reorderPublications = createSafeAction(
  reorderSchema,
  async (data): Promise<void> => {
    await prisma.$transaction(async (tx) => {
      // Step 1: Set all affected publications to negative temp indices
      // to avoid unique constraint violations during reassignment
      for (let i = 0; i < data.items.length; i++) {
        await tx.publication.update({
          where: { id: data.items[i].id },
          data: { index: -(i + 1) },
        });
      }

      // Step 2: Set final indices
      for (const item of data.items) {
        await tx.publication.update({
          where: { id: item.id },
          data: { index: item.order },
        });
      }
    });
  }
);

// ============================================================================
// DOI Lookup
// ============================================================================

/**
 * Look up publication metadata by DOI using OpenAlex/Crossref.
 */
export const lookupPublicationDoi = createSafeAction(
  doiLookupSchema,
  async (data): Promise<DoiLookupResult> => {
    const result = await lookupDoi(data.doi);

    if (!result) {
      throw new ActionError(
        "Could not find publication metadata for this DOI. " +
          "Please verify the DOI is correct and try again."
      );
    }

    return result;
  }
);

// ============================================================================
// Distinct Value Helpers
// ============================================================================

/**
 * Get all distinct journal names used in publications.
 */
export const getDistinctJournals = createAction(async (): Promise<string[]> => {
  const result = await prisma.publication.findMany({
    where: { journal: { not: null } },
    select: { journal: true },
    distinct: ["journal"],
    orderBy: { journal: "asc" },
  });

  return result.map((r) => r.journal).filter((j): j is string => j !== null);
});

/**
 * Get all distinct author names used across publications.
 */
export const getDistinctAuthors = createAction(async (): Promise<string[]> => {
  const result = await prisma.publication.findMany({
    select: { authors: true },
  });

  const authorSet = new Set<string>();

  for (const row of result) {
    try {
      const parsed = JSON.parse(row.authors);
      if (Array.isArray(parsed)) {
        for (const author of parsed) {
          if (typeof author === "string" && author.trim()) {
            authorSet.add(author.trim());
          }
        }
      }
    } catch {
      // Skip unparseable entries
    }
  }

  return Array.from(authorSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
});
