/**
 * Collaborator Server Actions
 *
 * CRUD operations for collaborators with type-safe validation.
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import {
  collaboratorSchema,
  reorderSchema,
  idSchema,
} from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";

// ============================================================================
// Types
// ============================================================================

export interface CollaboratorListItem {
  id: string;
  organization: string;
  leader: string | null;
  email: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  order: number;
  isHidden: boolean;
}

// ============================================================================
// Schemas (Extended)
// ============================================================================

const collaboratorWithCoordsSchema = z
  .object({})
  .merge(collaboratorSchema)
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== null && data.latitude !== undefined;
    const hasLng = data.longitude !== null && data.longitude !== undefined;

    if (hasLat && !hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Longitude is required when latitude is provided",
        path: ["longitude"],
      });
    } else if (!hasLat && hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude is required when longitude is provided",
        path: ["latitude"],
      });
    }
  });

const updateCollaboratorSchema = z
  .object({
    id: idSchema,
  })
  .merge(collaboratorSchema)
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== null && data.latitude !== undefined;
    const hasLng = data.longitude !== null && data.longitude !== undefined;

    if (hasLat && !hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Longitude is required when latitude is provided",
        path: ["longitude"],
      });
    } else if (!hasLat && hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude is required when longitude is provided",
        path: ["latitude"],
      });
    }
  });

const deleteCollaboratorSchema = z.object({
  id: idSchema,
});

const toggleHiddenSchema = z.object({
  id: idSchema,
  isHidden: z.boolean(),
});

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all collaborators, ordered by display order.
 */
export const getCollaborators = createAction(
  async (): Promise<CollaboratorListItem[]> => {
    return prisma.collaborator.findMany({
      select: {
        id: true,
        organization: true,
        leader: true,
        email: true,
        website: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        order: true,
        isHidden: true,
      },
      orderBy: { order: "asc" },
    });
  }
);

/**
 * Get a single collaborator by ID with full details.
 */
export const getCollaboratorById = createSafeAction(
  z.object({ id: idSchema }),
  async (data): Promise<CollaboratorListItem> => {
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        organization: true,
        leader: true,
        email: true,
        website: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        order: true,
        isHidden: true,
      },
    });

    if (!collaborator) {
      throw new ActionError("Collaborator not found");
    }

    return collaborator;
  }
);

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new collaborator at the end of the order.
 */
export const createCollaborator = createSafeAction(
  collaboratorWithCoordsSchema,
  async (data): Promise<CollaboratorListItem> => {
    // Get the maximum order value
    const maxOrder = await prisma.collaborator.aggregate({
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    const collaborator = await prisma.collaborator.create({
      data: {
        organization: data.organization,
        leader: data.leader,
        email: data.email,
        website: data.website,
        country: data.country,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        order: newOrder,
        isHidden: data.isHidden ?? false,
      },
      select: {
        id: true,
        organization: true,
        leader: true,
        email: true,
        website: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        order: true,
        isHidden: true,
      },
    });

    return collaborator;
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an existing collaborator.
 */
export const updateCollaborator = createSafeAction(
  updateCollaboratorSchema,
  async (data): Promise<CollaboratorListItem> => {
    const collaborator = await prisma.collaborator.update({
      where: { id: data.id },
      data: {
        organization: data.organization,
        leader: data.leader,
        email: data.email,
        website: data.website,
        country: data.country,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        isHidden: data.isHidden,
      },
      select: {
        id: true,
        organization: true,
        leader: true,
        email: true,
        website: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        order: true,
        isHidden: true,
      },
    });

    return collaborator;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a collaborator.
 */
export const deleteCollaborator = createSafeAction(
  deleteCollaboratorSchema,
  async (data): Promise<void> => {
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: data.id },
    });

    if (!collaborator) {
      throw new ActionError("Collaborator not found");
    }

    await prisma.collaborator.delete({
      where: { id: data.id },
    });
  }
);

// ============================================================================
// Toggle Hidden Operation
// ============================================================================

/**
 * Toggle collaborator visibility.
 */
export const toggleCollaboratorHidden = createSafeAction(
  toggleHiddenSchema,
  async (data): Promise<CollaboratorListItem> => {
    const collaborator = await prisma.collaborator.update({
      where: { id: data.id },
      data: { isHidden: data.isHidden },
      select: {
        id: true,
        organization: true,
        leader: true,
        email: true,
        website: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        order: true,
        isHidden: true,
      },
    });

    return collaborator;
  }
);

// ============================================================================
// Reorder Operation
// ============================================================================

/**
 * Reorder collaborators using a transaction for atomicity.
 */
export const reorderCollaborators = createSafeAction(
  reorderSchema,
  async (data): Promise<void> => {
    await prisma.$transaction(
      data.items.map(({ id, order }) =>
        prisma.collaborator.update({
          where: { id },
          data: { order },
        })
      )
    );
  }
);
