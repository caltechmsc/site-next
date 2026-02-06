/**
 * Photo Upload Dialog
 *
 * Modal dialog for batch uploading group photos.
 */

"use client";

import * as React from "react";
import { X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createPhoto } from "@/lib/admin/actions";
import { getCurrentDate } from "@/lib/date";

// ============================================================================
// Types
// ============================================================================

export interface PhotoUploadDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when upload is complete (with the upload date) */
  onUploadComplete: (uploadDate: string) => void;
}

interface SelectedFile {
  id: string;
  file: File;
  preview: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert a file to a base64 data URL string.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique ID for file tracking.
 */
function generateFileId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================================================
// Component
// ============================================================================

export function PhotoUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: PhotoUploadDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [date, setDate] = React.useState(getCurrentDate());
  const [files, setFiles] = React.useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setDate(getCurrentDate());
      setFiles((prev) => {
        prev.forEach((f) => URL.revokeObjectURL(f.preview));
        return [];
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [open]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const addFiles = React.useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );

    if (validFiles.length < newFiles.length) {
      toast.error("Some files were skipped (invalid type or too large)");
    }

    setFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        id: generateFileId(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files || []));

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles]
  );

  const handleRemoveFile = React.useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleUpload = React.useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(i + 1);

      try {
        const base64 = await fileToBase64(files[i].file);
        const result = await createPhoto({
          date,
          caption: null,
          imageData: {
            base64,
            filename: files[i].file.name,
            mimeType: files[i].file.type,
          },
        });

        if (result.success) {
          successCount++;
        } else {
          toast.error(
            `Failed to upload "${files[i].file.name}": ${result.error}`
          );
        }
      } catch {
        toast.error(`Failed to upload "${files[i].file.name}"`);
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} photo${successCount === 1 ? "" : "s"} uploaded successfully`
      );
      onUploadComplete(date);
      onOpenChange(false);
    }

    setIsUploading(false);
  }, [files, date, onUploadComplete, onOpenChange]);

  // Prevent closing while uploading
  const handleOpenChange = (newOpen: boolean) => {
    if (!isUploading) {
      onOpenChange(newOpen);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Upload group photos. All photos will share the same date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="upload-date">Date *</Label>
            <Input
              id="upload-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Drop Zone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={!isUploading ? handleDrop : undefined}
            className={cn(
              "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center",
              "transition-colors hover:border-primary/50 hover:bg-accent/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Click to select
                </span>{" "}
                or drag and drop
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF (max 10MB each)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Preview Grid */}
          {files.length > 0 && (
            <ScrollArea className="max-h-[240px]">
              <div className="grid grid-cols-3 gap-2">
                {files.map((file) => (
                  <div key={file.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="aspect-[4/3] w-full rounded-md object-cover"
                    />
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.id);
                        }}
                        className={cn(
                          "absolute right-1 top-1 flex h-6 w-6 items-center justify-center",
                          "rounded-full bg-black/60 text-white opacity-0 transition-opacity",
                          "hover:bg-black/80 group-hover:opacity-100"
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">
                Uploading {uploadProgress} of {files.length}...
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0 || !date}
          >
            {isUploading
              ? `Uploading (${uploadProgress}/${files.length})...`
              : files.length === 0
                ? "Upload Photos"
                : `Upload ${files.length} Photo${files.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
