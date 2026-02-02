/**
 * Group Photo Database Queries
 *
 * Centralized queries for group photo-related data operations.
 */

import { prisma } from "@/lib/db/client";
import { getYear } from "@/lib/date";
import type { GroupPhoto } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface PhotosByYear {
  year: number;
  photos: GroupPhoto[];
}

export interface PhotoStats {
  totalPhotos: number;
  yearRange: { min: number; max: number } | null;
}

// ============================================================================
// List Queries
// ============================================================================

/**
 * Get all photos grouped by year (descending).
 */
export async function getPhotosGroupedByYear(): Promise<PhotosByYear[]> {
  const photos = await prisma.groupPhoto.findMany({
    orderBy: [{ date: "desc" }, { order: "asc" }],
  });

  // Group photos by year
  const photosByYear = new Map<number, GroupPhoto[]>();

  for (const photo of photos) {
    const year = getYear(photo.date);
    if (!photosByYear.has(year)) {
      photosByYear.set(year, []);
    }
    photosByYear.get(year)!.push(photo);
  }

  // Convert to array sorted by year (descending)
  return Array.from(photosByYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, photos]) => ({ year, photos }));
}

/**
 * Get all photos as a flat list.
 */
export async function getAllPhotos(): Promise<GroupPhoto[]> {
  return prisma.groupPhoto.findMany({
    orderBy: [{ date: "desc" }, { order: "asc" }],
  });
}

/**
 * Get a single photo by ID.
 */
export async function getPhotoById(id: string): Promise<GroupPhoto | null> {
  return prisma.groupPhoto.findUnique({
    where: { id },
  });
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get photo statistics.
 */
export async function getPhotoStats(): Promise<PhotoStats> {
  const [totalPhotos, dateRange] = await Promise.all([
    prisma.groupPhoto.count(),
    prisma.groupPhoto.aggregate({
      _min: { date: true },
      _max: { date: true },
    }),
  ]);

  // Only compute year range if photos exist
  if (totalPhotos === 0) {
    return { totalPhotos: 0, yearRange: null };
  }

  const minYear = dateRange._min.date ? getYear(dateRange._min.date) : null;
  const maxYear = dateRange._max.date ? getYear(dateRange._max.date) : null;

  return {
    totalPhotos,
    yearRange: minYear && maxYear ? { min: minYear, max: maxYear } : null,
  };
}
