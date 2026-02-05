import { Suspense } from "react";

import { PageHeader } from "@/components/admin/layout";
import { CollaboratorListSkeleton } from "@/components/admin/shared";
import { getCollaborators } from "@/lib/admin/actions";
import { CollaboratorList } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: "Collaborators | Admin",
  description: "Manage collaborators and their locations",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function CollaboratorsPage() {
  const result = await getCollaborators();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaborators"
        description="Manage research collaborators and partners, and their locations on the map."
      />

      <Suspense fallback={<CollaboratorListSkeleton />}>
        <CollaboratorList collaborators={result.data} />
      </Suspense>
    </div>
  );
}
