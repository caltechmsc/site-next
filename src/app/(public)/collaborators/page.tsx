import type { Metadata } from "next";
import { Globe, MapPin, Users } from "lucide-react";

import {
  getCollaborators,
  getCollaboratorStats,
  getCollaboratorFilterOptions,
} from "@/lib/db/queries/collaborators";
import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { CollaboratorList } from "@/components/collaborator";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "Collaborators",
  description: pageDescriptions.collaborators,
  path: "/collaborators",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function CollaboratorsPage() {
  const [collaborators, stats, filterOptions] = await Promise.all([
    getCollaborators(),
    getCollaboratorStats(),
    getCollaboratorFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Collaborators</h1>
        <p className="mt-2 text-muted-foreground">
          Our research partners and collaborators around the world, working
          together to advance computational science and materials simulation.
        </p>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {stats.total}
            </span>
            collaborators
          </span>
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {stats.countries}
            </span>
            countries
          </span>
          {stats.withCoords > 0 && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium tabular-nums text-foreground">
                {stats.withCoords}
              </span>
              on map
            </span>
          )}
        </div>
      </header>

      {/* Collaborator List with Map */}
      {collaborators.length > 0 ? (
        <CollaboratorList
          collaborators={collaborators}
          countries={filterOptions.countries}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No collaborators available yet.
          </p>
        </div>
      )}
    </div>
  );
}
