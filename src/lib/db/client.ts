/**
 * Prisma Client Singleton
 *
 * Ensures a single PrismaClient instance across the application.
 * Prevents connection exhaustion during Next.js hot reloads in development.
 */

import { PrismaClient } from "@prisma/client";

// ============================================================================
// Global Instance (Hot Reload Safe)
// ============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma Client instance.
 *
 * In development, reuses the same instance across hot reloads.
 * In production, creates a new instance per cold start.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
