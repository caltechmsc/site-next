/**
 * Member Server Actions
 *
 * CRUD operations for members with type-safe validation.
 * Includes image processing for member avatars.
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { memberSchema, reorderSchema, idSchema } from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";
import {
  processAndSaveImage,
  deleteImage,
  isUploadedImage,
  type ImageData,
} from "@/lib/admin/image";

// ============================================================================
// Types
// ============================================================================

export interface MemberWithCategory {
  id: string;
  name: string;
  aliases: string | null;
  email: string | null;
  photo: string | null;
  website: string | null;
  position: string | null;
  education: string | null;
  bio: string | null;
  orcid: string | null;
  categoryId: string;
  startDate: string;
  endDate: string | null;
  order: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
}

export interface MemberListItem {
  id: string;
  name: string;
  email: string | null;
  photo: string | null;
  position: string | null;
  order: number;
  isHidden: boolean;
  category: {
    id: string;
    name: string;
  };
}

// ============================================================================
// Schemas (Extended)
// ============================================================================

const imageDataSchema = z
  .object({
    base64: z.string(),
    filename: z.string(),
    mimeType: z.string(),
  })
  .nullable()
  .optional();

const createMemberSchema = memberSchema.extend({
  imageData: imageDataSchema,
});

const updateMemberSchema = memberSchema.extend({
  id: idSchema,
  imageData: imageDataSchema,
});

const deleteMemberSchema = z.object({
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
 * Get all members with their categories, ordered by category order then member order.
 */
export const getMembers = createAction(async (): Promise<MemberListItem[]> => {
  return prisma.member.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      photo: true,
      position: true,
      order: true,
      isHidden: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });
});

/**
 * Get a single member by ID with full details.
 */
export const getMemberById = createSafeAction(
  z.object({ id: idSchema }),
  async (data): Promise<MemberWithCategory> => {
    const member = await prisma.member.findUnique({
      where: { id: data.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      throw new ActionError("Member not found");
    }

    return member;
  }
);

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new member at the end of the order within their category.
 * Handles image upload if provided.
 */
export const createMember = createSafeAction(
  createMemberSchema,
  async (data): Promise<MemberWithCategory> => {
    // Verify category exists
    const category = await prisma.memberCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ActionError("Category not found");
    }

    // Get the maximum order value within this category
    const maxOrder = await prisma.member.aggregate({
      where: { categoryId: data.categoryId },
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    // Process image if provided
    let photoPath: string | null = null;

    // Create member first to get ID for image filename
    const member = await prisma.member.create({
      data: {
        name: data.name,
        aliases: data.aliases
          ? JSON.stringify(
              Array.isArray(data.aliases) ? data.aliases : [data.aliases]
            )
          : null,
        email: data.email,
        photo: null, // Will update after processing image
        website: data.website,
        position: data.position,
        education: data.education,
        bio: data.bio,
        orcid: data.orcid,
        categoryId: data.categoryId,
        startDate: data.startDate,
        endDate: data.endDate,
        order: newOrder,
        isHidden: data.isHidden ?? false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Process image if provided
    if (data.imageData) {
      const imageResult = await processAndSaveImage(
        "member",
        data.imageData as ImageData,
        member.id // Use member ID as filename
      );

      if (imageResult.success && imageResult.url) {
        photoPath = imageResult.url;

        // Update member with photo path
        const updatedMember = await prisma.member.update({
          where: { id: member.id },
          data: { photo: photoPath },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return updatedMember;
      }
    }

    return member;
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an existing member.
 * Handles image upload and deletion of old images.
 */
export const updateMember = createSafeAction(
  updateMemberSchema,
  async (data): Promise<MemberWithCategory> => {
    // Get existing member
    const existing = await prisma.member.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new ActionError("Member not found");
    }

    // Verify category exists if changed
    if (data.categoryId !== existing.categoryId) {
      const category = await prisma.memberCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new ActionError("Category not found");
      }
    }

    // Handle image changes
    let photoPath: string | null | undefined = undefined;

    if (data.imageData) {
      // New image uploaded - process it
      const imageResult = await processAndSaveImage(
        "member",
        data.imageData as ImageData,
        data.id // Use member ID as filename
      );

      if (imageResult.success && imageResult.url) {
        photoPath = imageResult.url;

        // Delete old image if it was an upload
        if (existing.photo && isUploadedImage(existing.photo)) {
          await deleteImage(existing.photo);
        }
      }
    } else if (data.photo === null && existing.photo) {
      // Image explicitly removed
      if (isUploadedImage(existing.photo)) {
        await deleteImage(existing.photo);
      }
      photoPath = null;
    }
    // If photo unchanged (data.photo has URL but no imageData), keep existing

    // Update member
    const member = await prisma.member.update({
      where: { id: data.id },
      data: {
        name: data.name,
        aliases: data.aliases
          ? JSON.stringify(
              Array.isArray(data.aliases) ? data.aliases : [data.aliases]
            )
          : null,
        email: data.email,
        photo: photoPath !== undefined ? photoPath : existing.photo,
        website: data.website,
        position: data.position,
        education: data.education,
        bio: data.bio,
        orcid: data.orcid,
        categoryId: data.categoryId,
        startDate: data.startDate,
        endDate: data.endDate,
        isHidden: data.isHidden,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return member;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a member and their avatar image.
 */
export const deleteMember = createSafeAction(
  deleteMemberSchema,
  async (data): Promise<void> => {
    // Get member to check for avatar
    const member = await prisma.member.findUnique({
      where: { id: data.id },
      select: {
        photo: true,
        _count: {
          select: {
            publications: true,
          },
        },
      },
    });

    if (!member) {
      throw new ActionError("Member not found");
    }

    // Check for publications
    if (member._count.publications > 0) {
      throw new ActionError(
        `Cannot delete this member because they have ${member._count.publications} publication(s) linked. ` +
          "Please unlink publications first."
      );
    }

    // Delete avatar if exists
    if (member.photo && isUploadedImage(member.photo)) {
      await deleteImage(member.photo);
    }

    // Delete member
    await prisma.member.delete({
      where: { id: data.id },
    });
  }
);

// ============================================================================
// Toggle Hidden Operation
// ============================================================================

/**
 * Toggle member visibility.
 */
export const toggleMemberHidden = createSafeAction(
  toggleHiddenSchema,
  async (data): Promise<MemberListItem> => {
    const member = await prisma.member.update({
      where: { id: data.id },
      data: { isHidden: data.isHidden },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        position: true,
        order: true,
        isHidden: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return member;
  }
);

// ============================================================================
// Reorder Operation
// ============================================================================

/**
 * Reorder members using a transaction for atomicity.
 */
export const reorderMembers = createSafeAction(
  reorderSchema,
  async (data): Promise<void> => {
    await prisma.$transaction(
      data.items.map(({ id, order }) =>
        prisma.member.update({
          where: { id },
          data: { order },
        })
      )
    );
  }
);
