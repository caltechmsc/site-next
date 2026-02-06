/**
 * Slug Utilities
 *
 * Functions for generating URL-safe slugs from text.
 */

// ============================================================================
// Slug Generation
// ============================================================================

/**
 * Generate a URL-safe slug from a string.
 */
export function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, "")
      // Collapse multiple consecutive hyphens into one
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Generate a unique slug by appending a suffix if needed.
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[]
): string {
  const baseSlug = generateSlug(text);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // Find the next available number suffix
  let counter = 1;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug;
}

/**
 * Validate if a string is a valid slug.
 */
export function isValidSlug(slug: string): boolean {
  // Must be non-empty
  if (!slug) return false;

  // Must only contain lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) return false;

  // Must not start or end with a hyphen
  if (slug.startsWith("-") || slug.endsWith("-")) return false;

  // Must not have consecutive hyphens
  if (/--/.test(slug)) return false;

  return true;
}
