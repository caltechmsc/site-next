/**
 * Image Processing Configuration
 *
 * Centralized configuration for all image types.
 * Adjust these settings to change image processing behavior.
 */

import type {
  ImageType,
  ImageTypeConfig,
  ImageValidationConfig,
} from "./types";

// ============================================================================
// Image Type Configurations
// ============================================================================

/**
 * Processing configuration for each image type.
 */
export const IMAGE_CONFIGS: Record<ImageType, ImageTypeConfig> = {
  member: {
    directory: "uploads/members",
    maxWidth: 800,
    maxHeight: 800,
    format: "webp",
    quality: 85,
    maintainAspectRatio: true,
  },

  photo: {
    directory: "uploads/photos",
    maxWidth: null,
    maxHeight: null,
    format: "jpeg",
    quality: 90,
    maintainAspectRatio: true,
  },
};

// ============================================================================
// Validation Configuration
// ============================================================================

/**
 * Global validation constraints for all image uploads.
 */
export const IMAGE_VALIDATION: ImageValidationConfig = {
  /** Maximum file size: 10MB */
  maxSize: 10 * 1024 * 1024,
  /** Allowed image MIME types */
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get configuration for a specific image type.
 */
export function getImageConfig(type: ImageType): ImageTypeConfig {
  return IMAGE_CONFIGS[type];
}

/**
 * Get the file extension for a given format.
 */
export function getFormatExtension(format: ImageTypeConfig["format"]): string {
  const extensions: Record<ImageTypeConfig["format"], string> = {
    webp: ".webp",
    jpeg: ".jpg",
    png: ".png",
  };
  return extensions[format];
}
