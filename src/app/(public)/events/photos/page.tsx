import type { Metadata } from "next";
import { Camera, Calendar as CalendarIcon } from "lucide-react";

import { getPhotosGroupedByYear, getPhotoStats } from "@/lib/db/queries/photos";
import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { PhotoGallery } from "@/components/events";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "Group Photos",
  description: pageDescriptions.photos,
  path: "/events/photos",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function PhotosPage() {
  const [photosByYear, stats] = await Promise.all([
    getPhotosGroupedByYear(),
    getPhotoStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Group Photos</h1>
        <p className="mt-2 text-muted-foreground">
          A visual journey through the MSC community over the years. Hover to
          see the photos in color, click to view full size.
        </p>

        {/* Stats */}
        {stats.totalPhotos > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="font-medium tabular-nums text-foreground">
                {stats.totalPhotos}
              </span>
              photo{stats.totalPhotos !== 1 ? "s" : ""}
            </span>
            {stats.yearRange && (
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="tabular-nums">
                  {stats.yearRange.min === stats.yearRange.max
                    ? stats.yearRange.min
                    : `${stats.yearRange.min} – ${stats.yearRange.max}`}
                </span>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Photo Gallery */}
      {photosByYear.length > 0 ? (
        <PhotoGallery photosByYear={photosByYear} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No photos available yet.</p>
        </div>
      )}
    </div>
  );
}
