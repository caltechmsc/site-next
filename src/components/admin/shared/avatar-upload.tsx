/**
 * Avatar Upload Component
 *
 * Image upload with cropping for member avatars.
 * Uses react-image-crop for 1:1 aspect ratio cropping.
 */

"use client";

import * as React from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, Upload, X, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MemberPortrait,
  type PortraitSize,
} from "@/components/ui/member-portrait";

// ============================================================================
// Types
// ============================================================================

export interface AvatarUploadProps {
  /** Member's name (for fallback avatar) */
  name: string;
  /** Current image URL */
  value?: string | null;
  /** Callback when image changes (base64 data) */
  onChange: (imageData: AvatarImageData | null) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Avatar display size */
  size?: PortraitSize;
  /** Additional class names */
  className?: string;
}

export interface AvatarImageData {
  /** Base64-encoded image data */
  base64: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CROP_ASPECT = 1; // 1:1 square

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a centered aspect crop for the image.
 */
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Get cropped image as base64 data URL.
 */
async function getCroppedImageData(
  image: HTMLImageElement,
  crop: Crop,
  filename: string
): Promise<AvatarImageData> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate crop dimensions in pixels
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelCrop = {
    x: (crop.x! / 100) * image.width * scaleX,
    y: (crop.y! / 100) * image.height * scaleY,
    width: (crop.width! / 100) * image.width * scaleX,
    height: (crop.height! / 100) * image.height * scaleY,
  };

  // Set output size (max 800px for reasonable file size)
  const outputSize = Math.min(800, Math.max(pixelCrop.width, pixelCrop.height));
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw cropped area
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Convert to base64
  const base64 = canvas.toDataURL("image/jpeg", 0.9);

  return {
    base64,
    filename: filename.replace(/\.[^.]+$/, ".jpg"),
    mimeType: "image/jpeg",
  };
}

// ============================================================================
// Component
// ============================================================================

export function AvatarUpload({
  name,
  value,
  onChange,
  disabled = false,
  size = "lg",
  className,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [filename, setFilename] = React.useState<string>("");
  const [crop, setCrop] = React.useState<Crop>();
  const [error, setError] = React.useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please select a JPEG, PNG, or WebP image");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError("Image must be less than 5MB");
        return;
      }

      setError(null);
      setFilename(file.name);

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setDialogOpen(true);
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be selected again
      e.target.value = "";
    },
    []
  );

  // Handle image load in crop dialog
  const handleImageLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, CROP_ASPECT));
    },
    []
  );

  // Handle crop confirmation
  const handleConfirmCrop = React.useCallback(async () => {
    if (!imageRef.current || !crop) return;

    try {
      const imageData = await getCroppedImageData(
        imageRef.current,
        crop,
        filename
      );
      onChange(imageData);
      setDialogOpen(false);
      setImageSrc(null);
    } catch (err) {
      console.error("Failed to crop image:", err);
      setError("Failed to process image");
    }
  }, [crop, filename, onChange]);

  // Handle dialog close
  const handleDialogClose = React.useCallback(() => {
    setDialogOpen(false);
    setImageSrc(null);
    setCrop(undefined);
  }, []);

  // Handle remove avatar
  const handleRemove = React.useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar Display */}
      <div className="group relative">
        <MemberPortrait
          name={name}
          photo={value}
          size={size}
          variant="circle"
        />

        {/* Upload Overlay */}
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full",
              "bg-black/60 opacity-0 transition-opacity",
              "focus:opacity-100 group-hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
          >
            <Camera className="h-6 w-6 text-white" />
            <span className="sr-only">Change avatar</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Crop Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Avatar</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center py-4">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={CROP_ASPECT}
                circularCrop
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  style={{ maxHeight: "400px" }}
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCrop} disabled={!crop}>
              <Check className="h-4 w-4" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
