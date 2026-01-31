/**
 * Collaborator Database Queries
 *
 * Centralized queries for collaborator-related data operations.
 */

import { prisma } from "@/lib/db/client";
import type { Collaborator } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface CollaboratorWithCoords extends Collaborator {
  hasCoords: boolean;
}

export interface CollaboratorStats {
  total: number;
  countries: number;
  withCoords: number;
}

export interface CollaboratorFilterOptions {
  countries: string[];
}

// ============================================================================
// List Queries
// ============================================================================

/**
 * Get all visible collaborators ordered by position.
 */
export async function getCollaborators(): Promise<CollaboratorWithCoords[]> {
  const collaborators = await prisma.collaborator.findMany({
    where: { isHidden: false },
    orderBy: { order: "asc" },
  });

  return collaborators.map((c) => ({
    ...c,
    hasCoords: c.latitude !== null && c.longitude !== null,
  }));
}

/**
 * Get collaborators that have valid coordinates (for map display).
 */
export async function getCollaboratorsWithCoords(): Promise<
  CollaboratorWithCoords[]
> {
  const collaborators = await prisma.collaborator.findMany({
    where: {
      isHidden: false,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { order: "asc" },
  });

  return collaborators.map((c) => ({
    ...c,
    hasCoords: true,
  }));
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get collaborator statistics.
 */
export async function getCollaboratorStats(): Promise<CollaboratorStats> {
  const [total, countriesResult, withCoordsCount] = await Promise.all([
    prisma.collaborator.count({ where: { isHidden: false } }),
    prisma.collaborator.findMany({
      where: { isHidden: false, country: { not: null } },
      select: { country: true },
      distinct: ["country"],
    }),
    prisma.collaborator.count({
      where: {
        isHidden: false,
        latitude: { not: null },
        longitude: { not: null },
      },
    }),
  ]);

  return {
    total,
    countries: countriesResult.length,
    withCoords: withCoordsCount,
  };
}

/**
 * Get available filter options.
 */
export async function getCollaboratorFilterOptions(): Promise<CollaboratorFilterOptions> {
  const countriesResult = await prisma.collaborator.findMany({
    where: { isHidden: false, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });

  return {
    countries: countriesResult
      .map((c) => c.country)
      .filter((c): c is string => c !== null),
  };
}
