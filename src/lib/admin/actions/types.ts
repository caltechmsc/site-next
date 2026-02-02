/**
 * Admin Actions Types
 *
 * Unified type definitions for all admin Server Actions.
 */

// ============================================================================
// Action Result Types
// ============================================================================

/**
 * Successful action result.
 */
export interface ActionSuccess<T = void> {
  success: true;
  data: T;
}

/**
 * Failed action result with error message.
 */
export interface ActionError {
  success: false;
  error: string;
}

/**
 * Failed action result with field-level validation errors.
 */
export interface ActionValidationError {
  success: false;
  error: string;
  fieldErrors: FieldErrors;
}

/**
 * Unified action result type.
 */
export type ActionResult<T = void> =
  | ActionSuccess<T>
  | ActionError
  | ActionValidationError;

// ============================================================================
// Form Error Types
// ============================================================================

/**
 * Field-level validation errors.
 * Key is the field name, value is an array of error messages.
 */
export type FieldErrors = Record<string, string[]>;

/**
 * Check if an action result has field errors.
 */
export function hasFieldErrors(
  result: ActionResult<unknown>
): result is ActionValidationError {
  return !result.success && "fieldErrors" in result;
}

// ============================================================================
// Form Data Types (Inputs)
// ============================================================================

// ----------------------------------------------------------------------------
// Member
// ----------------------------------------------------------------------------

export interface MemberFormData {
  name: string;
  aliases?: string[] | null;
  email?: string | null;
  photo?: string | null;
  website?: string | null;
  position?: string | null;
  education?: string | null;
  bio?: string | null;
  orcid?: string | null;
  categoryId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  isHidden?: boolean;
}

// ----------------------------------------------------------------------------
// Member Category
// ----------------------------------------------------------------------------

export interface CategoryFormData {
  name: string;
  showByDefault?: boolean;
}

// ----------------------------------------------------------------------------
// Research Area
// ----------------------------------------------------------------------------

export interface ResearchAreaFormData {
  slug: string;
  title: string;
  keywords?: string[] | null;
  content?: string | null;
  parentId?: string | null;
  isHidden?: boolean;
}

// ----------------------------------------------------------------------------
// Collaborator
// ----------------------------------------------------------------------------

export interface CollaboratorFormData {
  organization: string;
  leader?: string | null;
  email?: string | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isHidden?: boolean;
}

// ----------------------------------------------------------------------------
// Group Photo
// ----------------------------------------------------------------------------

export interface PhotoFormData {
  date: string; // YYYY-MM-DD
  caption?: string | null;
}

export interface PhotoUploadData {
  date: string; // YYYY-MM-DD
  caption?: string | null;
}

// ----------------------------------------------------------------------------
// Admin
// ----------------------------------------------------------------------------

export type AdminRole = "admin" | "editor";

export interface AdminCreateFormData {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

export interface AdminUpdateFormData {
  name?: string;
  role?: AdminRole;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// Reorder Types
// ============================================================================

export interface ReorderItem {
  id: string;
  order: number;
}

export interface ReorderInput {
  items: ReorderItem[];
}

// ============================================================================
// Common Patterns
// ============================================================================

/**
 * Create a success result.
 */
export function success<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

/**
 * Create a success result without data.
 */
export function successVoid(): ActionSuccess<void> {
  return { success: true, data: undefined };
}

/**
 * Create an error result.
 */
export function error(message: string): ActionError {
  return { success: false, error: message };
}

/**
 * Create a validation error result.
 */
export function validationError(
  message: string,
  fieldErrors: FieldErrors
): ActionValidationError {
  return { success: false, error: message, fieldErrors };
}
