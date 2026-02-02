/**
 * Photo Card Component
 *
 * Individual photo with grayscale-to-color hover effect.
 * Supports lazy loading via Intersection Observer for performance.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";

import type { GroupPhoto } from "@/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";

// ============================================================================
// Types
// ============================================================================

interface PhotoCardProps {
  photo: GroupPhoto;
  onClick?: () => void;
  className?: string;
  lazy?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PhotoCard({
  photo,
  onClick,
  className,
  lazy = false,
}: PhotoCardProps) {
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const formattedDate = formatDate(photo.date, "short");

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before entering viewport
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted",
        "transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
    >
      {/* Placeholder skeleton */}
      {(!isVisible || !isLoaded) && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Image with grayscale effect */}
      {isVisible && (
        <Image
          src={photo.imageUrl}
          alt={photo.caption || `Group photo from ${formattedDate}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            "object-cover transition-all duration-500",
            // Grayscale by default, color on hover
            "grayscale group-hover:grayscale-0",
            // Subtle scale on hover
            "group-hover:scale-105",
            // Fade in when loaded
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Subtle overlay gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent",
          "opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100"
        )}
      />

      {/* Caption overlay (visible on hover) */}
      {photo.caption && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3",
            "translate-y-full transition-transform duration-300",
            "group-hover:translate-y-0"
          )}
        >
          <p className="text-sm font-medium text-white drop-shadow-lg">
            {photo.caption}
          </p>
        </div>
      )}

      {/* Date badge (always visible) */}
      <div className="absolute right-2 top-2">
        <span
          className={cn(
            "rounded bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm",
            "transition-colors duration-300",
            "group-hover:bg-primary group-hover:text-primary-foreground"
          )}
        >
          {formattedDate}
        </span>
      </div>

      {/* Expand icon on hover */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100"
        )}
      >
        <span className="rounded-full bg-background/80 p-3 backdrop-blur-sm">
          <Expand className="h-5 w-5 text-foreground" />
        </span>
      </div>
    </button>
  );
}
