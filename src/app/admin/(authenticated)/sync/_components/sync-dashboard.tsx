/**
 * Sync Dashboard
 *
 * Main client component for the sync page.
 */

"use client";

import { useRouter } from "next/navigation";

import type { SyncStats } from "@/lib/admin/actions";
import { SyncStatsCards } from "./sync-stats-cards";
import { SyncControls } from "./sync-controls";
import { SyncProgressPanel } from "./sync-progress-panel";
import { useSync } from "./use-sync";

// ============================================================================
// Types
// ============================================================================

export interface SyncDashboardProps {
  stats: SyncStats;
}

// ============================================================================
// Component
// ============================================================================

export function SyncDashboard({ stats }: SyncDashboardProps) {
  const router = useRouter();
  const { state, startSync, reset } = useSync();

  /** Reset SSE state and refresh server-rendered stats */
  function handleReset() {
    reset();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <SyncStatsCards stats={stats} />
      <SyncControls status={state.status} onSync={startSync} />
      <SyncProgressPanel state={state} onReset={handleReset} />
    </div>
  );
}
