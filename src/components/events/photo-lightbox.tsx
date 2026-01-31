/**
 * Photo Lightbox Component
 *
 * Full-screen photo viewer with navigation.
 * Supports keyboard navigation and swipe gestures.
 */

"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import type { GroupPhoto } from "@/types";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

interface PhotoLightboxProps {
  photos: GroupPhoto[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: PhotoLightboxProps) {
  const photo = photos[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // Format date
  const date = new Date(photo.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrevious) onPrevious();
          break;
        case "ArrowRight":
          if (hasNext) onNext();
          break;
      }
    },
    [onClose, onPrevious, onNext, hasPrevious, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 text-white hover:bg-white/20 hover:text-white"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation - Previous */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/10"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Navigation - Next */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/10"
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Main Image Container */}
      <div
        className="relative mx-auto h-full max-h-[85vh] w-full max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.imageUrl}
          alt={photo.caption || `Group photo from ${formattedDate}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12">
        <div className="mx-auto flex max-w-4xl items-end justify-between text-white">
          <div>
            {photo.caption && (
              <p className="text-lg font-medium">{photo.caption}</p>
            )}
            <p className="text-sm text-white/70">{formattedDate}</p>
          </div>
          <div className="text-sm tabular-nums text-white/70">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>
      </div>
    </div>
  );
}
