import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/layout";
import { PublicationListSkeleton } from "@/components/admin/shared";
import {
  getPublications,
  getDistinctJournals,
  getDistinctAuthors,
} from "@/lib/admin/actions";
import { PublicationList } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Publications",
  description: "Manage research publications",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function PublicationsPage() {
  const [publicationsResult, journalsResult, authorsResult] = await Promise.all(
    [getPublications(), getDistinctJournals(), getDistinctAuthors()]
  );

  if (!publicationsResult.success) {
    throw new Error(publicationsResult.error);
  }

  if (!journalsResult.success) {
    throw new Error(journalsResult.error);
  }

  if (!authorsResult.success) {
    throw new Error(authorsResult.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publications"
        description="Manage research publications, their metadata, and display order."
      />

      <Suspense fallback={<PublicationListSkeleton />}>
        <PublicationList
          publications={publicationsResult.data}
          journals={journalsResult.data}
          authors={authorsResult.data}
        />
      </Suspense>
    </div>
  );
}
