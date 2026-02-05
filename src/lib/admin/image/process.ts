/**
 * Image Processing Functions
 *
 * Server-side image processing using Sharp.
 * Handles validation, resizing, format conversion, and storage.
 */

import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";

import type {
  ImageType,
  ImageData,
  ImageProcessResult,
  ImageDeleteResult,
  ImageValidationResult,
} from "./types";
import { getImageConfig, getFormatExtension, IMAGE_VALIDATION } from "./config";

// ============================================================================
// Constants
// ============================================================================

/** Base directory for public files */
const PUBLIC_DIR = path.join(process.cwd(), "public");

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate image data before processing.
 */
export function validateImageData(data: ImageData): ImageValidationResult {
  // Check MIME type
  if (!IMAGE_VALIDATION.allowedTypes.includes(data.mimeType)) {
    return {
      valid: false,
      error: `Invalid file type: ${data.mimeType}. Allowed types: ${IMAGE_VALIDATION.allowedTypes.join(", ")}`,
    };
  }

  // Extract base64 data (remove data URL prefix if present)
  const base64Data = data.base64.includes(",")
    ? data.base64.split(",")[1]
    : data.base64;

  // Calculate approximate file size (base64 is ~33% larger than binary)
  const estimatedSize = (base64Data.length * 3) / 4;

  if (estimatedSize > IMAGE_VALIDATION.maxSize) {
    const maxMB = Math.round(IMAGE_VALIDATION.maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxMB}MB`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Processing
// ============================================================================

/**
 * Process and save an uploaded image.
 */
export async function processAndSaveImage(
  type: ImageType,
  data: ImageData,
  filename: string
): Promise<ImageProcessResult> {
  try {
    // Validate first
    const validation = validateImageData(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get config for this image type
    const config = getImageConfig(type);

    // Extract base64 data
    const base64Data = data.base64.includes(",")
      ? data.base64.split(",")[1]
      : data.base64;

    // Convert to buffer
    const inputBuffer = Buffer.from(base64Data, "base64");

    // Configure Sharp pipeline
    let pipeline = sharp(inputBuffer);

    // Resize if configured
    if (config.maxWidth || config.maxHeight) {
      pipeline = pipeline.resize(config.maxWidth, config.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to output format
    switch (config.format) {
      case "webp":
        pipeline = pipeline.webp({ quality: config.quality });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality: config.quality });
        break;
      case "png":
        pipeline = pipeline.png({ quality: config.quality });
        break;
    }

    // Generate output path
    const extension = getFormatExtension(config.format);
    const outputFilename = `${filename}${extension}`;
    const relativePath = path.join(config.directory, outputFilename);
    const absolutePath = path.join(PUBLIC_DIR, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    // Save processed image
    await pipeline.toFile(absolutePath);

    // Return success with paths
    return {
      success: true,
      path: relativePath,
      url: `/${relativePath.replace(/\\/g, "/")}`,
    };
  } catch (error) {
    console.error("Image processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process image",
    };
  }
}

/**
 * Delete an image file from storage.
 */
export async function deleteImage(
  filePath: string
): Promise<ImageDeleteResult> {
  try {
    // Normalize path (remove leading slash if present)
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;

    const absolutePath = path.join(PUBLIC_DIR, normalizedPath);

    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch {
      // File doesn't exist - consider this a success
      return { success: true };
    }

    // Delete the file
    await fs.unlink(absolutePath);

    return { success: true };
  } catch (error) {
    console.error("Image deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete image",
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a path points to an uploaded image (vs external URL).
 */
export function isUploadedImage(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.startsWith("/uploads/") || path.startsWith("uploads/");
}
