import type { Metadata } from "next";
import { FileText, Quote, FlaskConical } from "lucide-react";

import {
  getResearchAreasHierarchy,
  getResearchAreasOverallStats,
} from "@/lib/db/queries/research";
import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { formatCompactNumber } from "@/lib/format";
import { ResearchHierarchy } from "@/components/research";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "Research",
  description: pageDescriptions.research,
  path: "/research",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function ResearchPage() {
  const [areas, overallStats] = await Promise.all([
    getResearchAreasHierarchy(),
    getResearchAreasOverallStats(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Research</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our research areas spanning computational methods development
          and applications in chemistry, materials science, and biology.
        </p>

        {/* Overall Stats */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {overallStats.totalAreas}
            </span>
            research areas
          </span>
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {overallStats.totalPublications}
            </span>
            publications
          </span>
          <span className="flex items-center gap-2">
            <Quote className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {formatCompactNumber(overallStats.totalCitations)}
            </span>
            total citations
          </span>
        </div>
      </header>

      {/* Research Areas Hierarchy */}
      {areas.length > 0 ? (
        <ResearchHierarchy areas={areas} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No research areas available yet.
          </p>
        </div>
      )}
    </div>
  );
}
