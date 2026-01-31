/**
 * Photo Gallery Component (Client-side)
 *
 * Virtualized gallery with lazy loading for large photo collections.
 * Uses window-based virtualization with dynamic row measurement.
 */

"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import type { GroupPhoto } from "@/types";
import type { PhotosByYear } from "@/lib/db/queries/photos";
import { PhotoCard } from "./photo-card";
import { PhotoLightbox } from "./photo-lightbox";

// ============================================================================
// Types
// ============================================================================

interface PhotoGalleryProps {
  photosByYear: PhotosByYear[];
}

type GalleryRow =
  | { type: "header"; year: number; count: number }
  | {
      type: "photos";
      yearIndex: number;
      photos: GroupPhoto[];
      startIndex: number;
    };

// ============================================================================
// Component
// ============================================================================

export function PhotoGallery({ photosByYear }: PhotoGalleryProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [columnsPerRow, setColumnsPerRow] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnsPerRow(1);
      else if (width < 1024) setColumnsPerRow(2);
      else setColumnsPerRow(3);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Flatten all photos for lightbox navigation
  const allPhotos = useMemo(
    () => photosByYear.flatMap((group) => group.photos),
    [photosByYear]
  );

  // Build virtualization rows: headers + photo rows
  const rows = useMemo((): GalleryRow[] => {
    const result: GalleryRow[] = [];
    let globalPhotoIndex = 0;

    photosByYear.forEach((yearGroup, yearIndex) => {
      // Add year header
      result.push({
        type: "header",
        year: yearGroup.year,
        count: yearGroup.photos.length,
      });

      // Chunk photos into rows
      for (let i = 0; i < yearGroup.photos.length; i += columnsPerRow) {
        result.push({
          type: "photos",
          yearIndex,
          photos: yearGroup.photos.slice(i, i + columnsPerRow),
          startIndex: globalPhotoIndex + i,
        });
      }

      globalPhotoIndex += yearGroup.photos.length;
    });

    return result;
  }, [photosByYear, columnsPerRow]);

  // Window-based virtualizer with dynamic measurement
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 200, // Initial estimate, will be replaced by measured values
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const openLightbox = useCallback((globalIndex: number) => {
    setLightboxIndex(globalIndex);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goToPrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null && prev < allPhotos.length - 1 ? prev + 1 : prev
    );
  }, [allPhotos.length]);

  // Use virtualization for large datasets (> 50 photos)
  const useVirtualization = allPhotos.length > 50;

  if (!useVirtualization) {
    // Simple rendering for small datasets
    return (
      <>
        <div className="space-y-12">
          {photosByYear.map((yearGroup, yearIndex) => {
            const baseIndex = photosByYear
              .slice(0, yearIndex)
              .reduce((acc, g) => acc + g.photos.length, 0);

            return (
              <section key={yearGroup.year}>
                <YearHeader
                  year={yearGroup.year}
                  count={yearGroup.photos.length}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {yearGroup.photos.map((photo, photoIndex) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={() => openLightbox(baseIndex + photoIndex)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={allPhotos}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}
      </>
    );
  }

  // Window-based virtualized rendering for large datasets
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>
      <div
        ref={listRef}
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index];

          if (row.type === "header") {
            return (
              <div
                key={`header-${row.year}`}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <YearHeader year={row.year} count={row.count} />
              </div>
            );
          }

          return (
            <div
              key={`row-${row.yearIndex}-${row.startIndex}`}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                {row.photos.map((photo, i) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={() => openLightbox(row.startIndex + i)}
                    lazy
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={allPhotos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function YearHeader({ year, count }: { year: number; count: number }) {
  return (
    <div className="mb-4 flex items-center gap-3 pt-4 first:pt-0">
      <h2 className="text-xl font-semibold tabular-nums">{year}</h2>
      <div className="h-px flex-1 bg-border" />
      <span className="text-sm text-muted-foreground">
        {count} photo{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
