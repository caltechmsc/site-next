/**
 * Photo Server Actions
 *
 * CRUD operations for group photos with type-safe validation.
 * Includes image processing for photo uploads.
 * All actions use createSafeAction for automatic validation and error handling.
 */

"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { photoSchema, reorderSchema, idSchema } from "@/lib/admin/schemas";
import { createSafeAction, createAction, ActionError } from "./utils";
import {
  processAndSaveImage,
  deleteImage,
  isUploadedImage,
  type ImageData,
} from "@/lib/admin/image";
import { getYear, startOfYear, endOfYear } from "@/lib/date";

// ============================================================================
// Types
// ============================================================================

export interface PhotoListItem {
  id: string;
  date: string;
  imageUrl: string;
  caption: string | null;
  order: number;
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

const createPhotoSchema = photoSchema.extend({
  imageData: z.object({
    base64: z.string(),
    filename: z.string(),
    mimeType: z.string(),
  }),
});

const updatePhotoSchema = photoSchema.extend({
  id: idSchema,
  imageData: imageDataSchema,
});

const deletePhotoSchema = z.object({
  id: idSchema,
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get the next order value for photos in a given year.
 */
async function getNextOrderForYear(
  year: number,
  excludeId?: string
): Promise<number> {
  const maxOrder = await prisma.groupPhoto.aggregate({
    where: {
      date: {
        gte: startOfYear(year),
        lte: endOfYear(year),
      },
      ...(excludeId && { id: { not: excludeId } }),
    },
    _max: { order: true },
  });

  return (maxOrder._max.order ?? -1) + 1;
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all photos, ordered by date descending then order ascending.
 */
export const getPhotos = createAction(async (): Promise<PhotoListItem[]> => {
  return prisma.groupPhoto.findMany({
    select: {
      id: true,
      date: true,
      imageUrl: true,
      caption: true,
      order: true,
    },
    orderBy: [{ date: "desc" }, { order: "asc" }],
  });
});

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new photo with image upload.
 * Uses the database ID as the image filename for lifecycle management.
 */
export const createPhoto = createSafeAction(
  createPhotoSchema,
  async (data): Promise<PhotoListItem> => {
    const year = getYear(data.date);
    const newOrder = await getNextOrderForYear(year);

    // Create photo record first to get ID
    const photo = await prisma.groupPhoto.create({
      data: {
        date: data.date,
        caption: data.caption,
        imageUrl: "", // Will update after processing
        order: newOrder,
      },
      select: {
        id: true,
        date: true,
        imageUrl: true,
        caption: true,
        order: true,
      },
    });

    // Process image using DB ID as filename
    const imageResult = await processAndSaveImage(
      "photo",
      data.imageData as ImageData,
      photo.id
    );

    if (imageResult.success && imageResult.url) {
      // Update photo with image URL
      const updatedPhoto = await prisma.groupPhoto.update({
        where: { id: photo.id },
        data: { imageUrl: imageResult.url },
        select: {
          id: true,
          date: true,
          imageUrl: true,
          caption: true,
          order: true,
        },
      });

      return updatedPhoto;
    }

    // Image processing failed - clean up DB record
    await prisma.groupPhoto.delete({ where: { id: photo.id } });
    throw new ActionError(imageResult.error || "Failed to process image");
  }
);

// ============================================================================
// Update Operation
// ============================================================================

/**
 * Update an existing photo.
 * Handles optional image replacement and year-change reordering.
 */
export const updatePhoto = createSafeAction(
  updatePhotoSchema,
  async (data): Promise<PhotoListItem> => {
    // Get existing photo
    const existing = await prisma.groupPhoto.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new ActionError("Photo not found");
    }

    // Handle image changes
    let imageUrl: string | undefined = undefined;

    if (data.imageData) {
      // New image uploaded - process it
      const imageResult = await processAndSaveImage(
        "photo",
        data.imageData as ImageData,
        data.id // Use same ID as filename (overwrite)
      );

      if (imageResult.success && imageResult.url) {
        imageUrl = imageResult.url;

        // Delete old image if it was an upload (different path)
        if (
          existing.imageUrl &&
          isUploadedImage(existing.imageUrl) &&
          existing.imageUrl !== imageResult.url
        ) {
          await deleteImage(existing.imageUrl);
        }
      }
    }

    // Handle year change - recalculate order if year changed
    let newOrder: number | undefined = undefined;

    if (getYear(data.date) !== getYear(existing.date)) {
      const year = getYear(data.date);
      newOrder = await getNextOrderForYear(year, data.id);
    }

    // Update photo
    const photo = await prisma.groupPhoto.update({
      where: { id: data.id },
      data: {
        date: data.date,
        caption: data.caption,
        ...(imageUrl !== undefined && { imageUrl }),
        ...(newOrder !== undefined && { order: newOrder }),
      },
      select: {
        id: true,
        date: true,
        imageUrl: true,
        caption: true,
        order: true,
      },
    });

    return photo;
  }
);

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a photo and its image file.
 */
export const deletePhoto = createSafeAction(
  deletePhotoSchema,
  async (data): Promise<void> => {
    // Get photo to check for image
    const photo = await prisma.groupPhoto.findUnique({
      where: { id: data.id },
      select: { imageUrl: true },
    });

    if (!photo) {
      throw new ActionError("Photo not found");
    }

    // Delete image file if exists
    if (photo.imageUrl && isUploadedImage(photo.imageUrl)) {
      await deleteImage(photo.imageUrl);
    }

    // Delete photo record
    await prisma.groupPhoto.delete({
      where: { id: data.id },
    });
  }
);

// ============================================================================
// Reorder Operation
// ============================================================================

/**
 * Reorder photos using a transaction for atomicity.
 */
export const reorderPhotos = createSafeAction(
  reorderSchema,
  async (data): Promise<void> => {
    await prisma.$transaction(
      data.items.map(({ id, order }) =>
        prisma.groupPhoto.update({
          where: { id },
          data: { order },
        })
      )
    );
  }
);
