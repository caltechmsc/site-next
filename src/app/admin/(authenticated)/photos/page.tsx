import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/layout";
import { PhotoGridSkeleton } from "@/components/admin/shared";
import { getPhotos } from "@/lib/admin/actions";
import { PhotoList } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Group Photos",
  description: "Manage group photos and display order",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function PhotosPage() {
  const result = await getPhotos();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Photos"
        description="Manage group photos organized by year. Drag to reorder within each year."
      />

      <Suspense fallback={<PhotoGridSkeleton />}>
        <PhotoList photos={result.data} />
      </Suspense>
    </div>
  );
}
