import { Suspense } from "react";

import { PageHeader } from "@/components/admin/layout";
import { ListSkeleton } from "@/components/admin/shared";
import { getCategories } from "@/lib/admin/actions";
import { CategoryList } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: "Member Categories | Admin",
  description: "Manage member categories and display order",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function CategoriesPage() {
  const result = await getCategories();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Categories"
        description="Organize members into categories. Drag to reorder how they appear on the public site."
        backHref="/admin/members"
        backLabel="Members"
      />

      <Suspense fallback={<ListSkeleton count={4} />}>
        <CategoryList categories={result.data} />
      </Suspense>
    </div>
  );
}
