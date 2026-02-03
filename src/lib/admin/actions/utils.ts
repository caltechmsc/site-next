/**
 * Admin Actions Utilities
 *
 * Helper functions for creating type-safe, authenticated Server Actions.
 */

import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth";
import {
  type ActionResult,
  type FieldErrors,
  success,
  error,
  validationError,
} from "./types";

// ============================================================================
// Authenticated Action Creators
// ============================================================================

/**
 * Creates a type-safe, authenticated Server Action with validation.
 */
export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (data: TInput) => Promise<TOutput>
): (input: unknown) => Promise<ActionResult<TOutput>> {
  return async (input: unknown): Promise<ActionResult<TOutput>> => {
    try {
      // 1. Verify authentication (with automatic token refresh)
      const user = await getAuthenticatedUser();
      if (!user) {
        return error("Session expired. Please log in again.");
      }

      // 2. Validate input
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        const fieldErrors = formatZodErrors(parsed.error);
        return validationError("Validation failed", fieldErrors);
      }

      // 3. Execute handler
      const result = await handler(parsed.data);
      return success(result);
    } catch (err) {
      return handleActionError(err);
    }
  };
}

/**
 * Creates an authenticated Server Action without input validation.
 * Use for actions that don't require input (e.g., fetching data).
 */
export function createAction<TOutput>(
  handler: () => Promise<TOutput>
): () => Promise<ActionResult<TOutput>> {
  return async (): Promise<ActionResult<TOutput>> => {
    try {
      // Verify authentication (with automatic token refresh)
      const user = await getAuthenticatedUser();
      if (!user) {
        return error("Session expired. Please log in again.");
      }

      const result = await handler();
      return success(result);
    } catch (err) {
      return handleActionError(err);
    }
  };
}

/**
 * Creates a type-safe Server Action WITHOUT authentication.
 * Use only for public actions that don't require login.
 */
export function createPublicAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (data: TInput) => Promise<TOutput>
): (input: unknown) => Promise<ActionResult<TOutput>> {
  return async (input: unknown): Promise<ActionResult<TOutput>> => {
    try {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        const fieldErrors = formatZodErrors(parsed.error);
        return validationError("Validation failed", fieldErrors);
      }

      const result = await handler(parsed.data);
      return success(result);
    } catch (err) {
      return handleActionError(err);
    }
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Unified error handler for all action types.
 */
function handleActionError(err: unknown): ActionResult<never> {
  // Handle known errors
  if (err instanceof ActionError) {
    return error(err.message);
  }

  // Handle Prisma errors
  if (isPrismaError(err)) {
    return error(formatPrismaError(err));
  }

  // Log unknown errors and return generic message
  console.error("Server action error:", err);
  return error("An unexpected error occurred");
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Custom error class for action errors.
 * Throw this in handlers to return a specific error message.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format Zod validation errors into field errors.
 */
function formatZodErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}

// ============================================================================
// Prisma Error Handling
// ============================================================================

interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
    field_name?: string;
    cause?: string;
  };
}

function isPrismaError(err: unknown): err is PrismaError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as PrismaError).code === "string"
  );
}

function formatPrismaError(err: PrismaError): string {
  switch (err.code) {
    case "P2002": {
      // Unique constraint violation
      const field = err.meta?.target?.[0] || "field";
      return `A record with this ${field} already exists`;
    }
    case "P2003": {
      // Foreign key constraint violation
      return "Cannot perform this operation due to related data";
    }
    case "P2025": {
      // Record not found
      return "Record not found";
    }
    case "P2014": {
      // Required relation violation
      return "Cannot delete this record because it is referenced by other data";
    }
    default:
      return "A database error occurred";
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Assert a condition, throwing an ActionError if false.
 */
export function assertAction(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new ActionError(message);
  }
}

/**
 * Ensure a value exists, throwing an ActionError if null/undefined.
 */
export function ensureExists<T>(
  value: T | null | undefined,
  message: string = "Record not found"
): T {
  if (value === null || value === undefined) {
    throw new ActionError(message);
  }
  return value;
}
