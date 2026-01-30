import type { Metadata } from "next";
import { FileText, Quote } from "lucide-react";

import {
  getPublications,
  getPublicationStats,
  getFilterOptions,
} from "@/lib/db/queries/publications";
import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { formatCompactNumber } from "@/lib/format";
import { PublicationList } from "@/components/publication";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "Publications",
  description: pageDescriptions.publications,
  path: "/publications",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function PublicationsPage() {
  const [publications, stats, filterOptions] = await Promise.all([
    getPublications(),
    getPublicationStats(),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Publications</h1>
        <p className="mt-2 text-muted-foreground">
          Research publications from the Materials and Process Simulation
          Center, spanning computational methods development and applications in
          chemistry, materials science, and biology.
        </p>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {formatCompactNumber(stats.totalPublications)}
            </span>
            publications
          </span>
          <span className="flex items-center gap-2">
            <Quote className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {formatCompactNumber(stats.totalCitations)}
            </span>
            total citations
          </span>
          <span className="text-xs">
            {stats.yearRange.min} – {stats.yearRange.max}
          </span>
        </div>
      </header>

      {/* Publication List with Filters */}
      {publications.length > 0 ? (
        <PublicationList
          publications={publications}
          filterOptions={filterOptions}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No publications available yet.
          </p>
        </div>
      )}
    </div>
  );
}
