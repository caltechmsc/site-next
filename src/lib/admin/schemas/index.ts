/**
 * Admin Validation Schemas
 *
 * Zod schemas for all admin form data validation.
 * These schemas ensure data integrity before database operations.
 */

import { z } from "zod";

// ============================================================================
// Common Validators
// ============================================================================

/** ISO date string format: YYYY-MM-DD */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
  .refine(
    (val) => {
      const [year, month, day] = val.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    },
    { message: "Invalid date" }
  );

/** Optional date string */
const optionalDateString = dateString.optional().nullable();

/** URL validation */
const urlString = z
  .string()
  .url("Invalid URL")
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform((val) => (val === "" ? null : val));

/** Email validation */
const emailString = z
  .string()
  .email("Invalid email address")
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform((val) => (val === "" ? null : val));

/** Non-empty trimmed string */
const nonEmptyString = z.string().trim().min(1, "This field is required");

/** Optional trimmed string */
const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === "" ? null : val));

/** String array from comma-separated values */
const stringArray = z
  .union([
    z.array(z.string()),
    z.string().transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    ),
  ])
  .optional()
  .nullable();

// ============================================================================
// Member Schemas
// ============================================================================

export const memberSchema = z.object({
  name: nonEmptyString,
  aliases: stringArray,
  email: emailString,
  photo: optionalString,
  website: urlString,
  position: optionalString,
  education: optionalString,
  bio: optionalString,
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "Invalid ORCID format")
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  categoryId: nonEmptyString,
  startDate: dateString,
  endDate: optionalDateString,
  isHidden: z.boolean().optional().default(false),
});

export type MemberInput = z.infer<typeof memberSchema>;

// ============================================================================
// Category Schemas
// ============================================================================

export const categorySchema = z.object({
  name: nonEmptyString,
  showByDefault: z.boolean().optional().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ============================================================================
// Research Area Schemas
// ============================================================================

export const researchAreaSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens"
    ),
  title: nonEmptyString,
  keywords: stringArray,
  content: optionalString,
  parentId: optionalString,
  isHidden: z.boolean().optional().default(false),
});

export type ResearchAreaInput = z.infer<typeof researchAreaSchema>;

// ============================================================================
// Collaborator Schemas
// ============================================================================

export const collaboratorSchema = z.object({
  organization: nonEmptyString,
  leader: optionalString,
  email: emailString,
  website: urlString,
  country: optionalString,
  city: optionalString,
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isHidden: z.boolean().optional().default(false),
});

export type CollaboratorInput = z.infer<typeof collaboratorSchema>;

// ============================================================================
// Group Photo Schemas
// ============================================================================

export const photoSchema = z.object({
  date: dateString,
  caption: optionalString,
});

export type PhotoInput = z.infer<typeof photoSchema>;

export const photoUploadSchema = z.object({
  date: dateString,
  caption: optionalString,
});

export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;

// ============================================================================
// Admin Schemas
// ============================================================================

export const adminRoleSchema = z.enum(["admin", "editor"]);

export const adminCreateSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  name: nonEmptyString,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  role: adminRoleSchema,
});

export type AdminCreateInput = z.infer<typeof adminCreateSchema>;

export const adminUpdateSchema = z.object({
  name: nonEmptyString.optional(),
  role: adminRoleSchema.optional(),
});

export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================================================
// Reorder Schemas
// ============================================================================

export const reorderItemSchema = z.object({
  id: z.string(),
  order: z.number().int(),
});

export const reorderSchema = z.object({
  items: z.array(reorderItemSchema).min(1, "At least one item is required"),
});

export type ReorderInput = z.infer<typeof reorderSchema>;

// ============================================================================
// ID Validation
// ============================================================================

export const idSchema = z.string().min(1, "ID is required");

// ============================================================================
// Export all schemas
// ============================================================================

export const schemas = {
  member: memberSchema,
  category: categorySchema,
  researchArea: researchAreaSchema,
  collaborator: collaboratorSchema,
  photo: photoSchema,
  photoUpload: photoUploadSchema,
  adminCreate: adminCreateSchema,
  adminUpdate: adminUpdateSchema,
  changePassword: changePasswordSchema,
  reorder: reorderSchema,
  id: idSchema,
};
