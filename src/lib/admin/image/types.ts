/**
 * Image Processing Types
 *
 * Type definitions for the admin image processing system.
 * Supports different image types with configurable processing options.
 */

// ============================================================================
// Image Type Configuration
// ============================================================================

/**
 * Supported image types for upload and processing.
 */
export type ImageType = "member" | "photo";

/**
 * Supported output formats.
 */
export type ImageFormat = "webp" | "jpeg" | "png";

/**
 * Configuration for processing a specific image type.
 */
export interface ImageTypeConfig {
  /** Directory relative to /public for storing images */
  directory: string;
  /** Maximum width in pixels (null = no resize) */
  maxWidth: number | null;
  /** Maximum height in pixels (null = no resize) */
  maxHeight: number | null;
  /** Output format */
  format: ImageFormat;
  /** Quality (1-100) */
  quality: number;
  /** Whether to maintain aspect ratio when resizing */
  maintainAspectRatio: boolean;
}

// ============================================================================
// Input/Output Types
// ============================================================================

/**
 * Raw image data from client upload.
 */
export interface ImageData {
  /** Base64-encoded image data (with or without data URL prefix) */
  base64: string;
  /** Original filename */
  filename: string;
  /** MIME type (e.g., "image/jpeg") */
  mimeType: string;
}

/**
 * Result of image processing operation.
 */
export interface ImageProcessResult {
  /** Whether processing succeeded */
  success: boolean;
  /** Relative path to the saved file (from /public) */
  path?: string;
  /** Full public URL path */
  url?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of image deletion operation.
 */
export interface ImageDeleteResult {
  /** Whether deletion succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation constraints for uploaded images.
 */
export interface ImageValidationConfig {
  /** Maximum file size in bytes */
  maxSize: number;
  /** Allowed MIME types */
  allowedTypes: string[];
}

/**
 * Result of image validation.
 */
export interface ImageValidationResult {
  /** Whether image is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}
