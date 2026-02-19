import type { Metadata } from "next";

import { getSyncStats } from "@/lib/admin/actions";
import { PageHeader } from "@/components/admin/layout";
import { SyncDashboard } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Data Sync",
  description: "Sync publication metadata and rebuild data relationships",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function SyncPage() {
  const result = await getSyncStats();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sync"
        description="Sync publication citations & keywords from OpenAlex/CrossRef, and rebuild all data relationships."
      />
      <SyncDashboard stats={result.data} />
    </div>
  );
}
