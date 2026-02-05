import { Suspense } from "react";

import { PageHeader } from "@/components/admin/layout";
import { ResearchTreeSkeleton } from "@/components/admin/shared";
import { getResearchAreasTree, getParentOptions } from "@/lib/admin/actions";
import { ResearchList } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: "Research Areas | Admin",
  description: "Manage research areas and their hierarchy",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function ResearchPage() {
  const [areasResult, parentsResult] = await Promise.all([
    getResearchAreasTree(),
    getParentOptions(),
  ]);

  if (!areasResult.success) {
    throw new Error(areasResult.error);
  }

  if (!parentsResult.success) {
    throw new Error(parentsResult.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Areas"
        description="Organize research areas into a hierarchy. Drag to reorder within each level."
      />

      <Suspense fallback={<ResearchTreeSkeleton />}>
        <ResearchList
          areas={areasResult.data}
          parentOptions={parentsResult.data}
        />
      </Suspense>
    </div>
  );
}
