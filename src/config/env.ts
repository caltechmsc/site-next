/**
 * Environment Variable Validation
 *
 * Validates and exports environment variables with type safety.
 * Fails fast at startup if required variables are missing.
 */

import { z } from "zod";

// ============================================================================
// Schema Definition
// ============================================================================

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // External APIs (optional)
  OPENALEX_API_KEY: z.string().optional(),

  // Authentication (optional, for admin panel)
  // Note: These are validated at runtime by NextAuth, not here
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
});

// ============================================================================
// Validation & Export
// ============================================================================

/**
 * Validated environment variables.
 *
 * @throws {ZodError} If validation fails
 */
export const env = envSchema.parse(process.env);

/**
 * Type of validated environment variables.
 */
export type Env = z.infer<typeof envSchema>;
