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
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication (required for admin panel)
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Google OAuth (required for admin login)
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // External APIs (optional)
  OPENALEX_API_KEY: z.string().optional(),
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
