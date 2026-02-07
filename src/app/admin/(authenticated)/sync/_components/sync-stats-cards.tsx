/**
 * Sync Stats Cards
 *
 * Overview statistics for the sync page.
 */

"use client";

import { Database, Link2, FlaskConical, Clock } from "lucide-react";

import type { SyncStats } from "@/lib/admin/actions";
import { StatCard } from "@/components/admin/dashboard";

// ============================================================================
// Types
// ============================================================================

export interface SyncStatsCardsProps {
  stats: SyncStats;
}

// ============================================================================
// Component
// ============================================================================

export function SyncStatsCards({ stats }: SyncStatsCardsProps) {
  const totalRelationships =
    stats.relationships.pubMember +
    stats.relationships.pubArea +
    stats.relationships.memberArea;

  const areasMissingKeywords =
    stats.entities.researchAreas - stats.entities.researchAreasWithKeywords;

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        Overview
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Publications with DOI"
          value={`${stats.publicationsWithDoi} / ${stats.publicationsTotal}`}
          description={
            stats.publicationsUnsynced > 0
              ? `${stats.publicationsUnsynced} never synced`
              : "All synced"
          }
          icon={Database}
          variant={stats.publicationsUnsynced > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Relationships"
          value={totalRelationships}
          description={`${stats.relationships.pubMember} pub↔member · ${stats.relationships.pubArea} pub↔area · ${stats.relationships.memberArea} mem↔area`}
          icon={Link2}
          variant="info"
        />
        <StatCard
          title="Matchable Entities"
          value={`${stats.entities.members} · ${stats.entities.researchAreasWithKeywords}`}
          description={
            areasMissingKeywords > 0
              ? `${areasMissingKeywords} areas missing keywords`
              : `${stats.entities.members} members · ${stats.entities.researchAreasWithKeywords} areas`
          }
          icon={FlaskConical}
          variant={areasMissingKeywords > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Last Synced"
          value={
            stats.lastSyncedAt
              ? formatRelativeTime(new Date(stats.lastSyncedAt))
              : "Never"
          }
          description={
            stats.lastSyncedAt
              ? new Date(stats.lastSyncedAt).toLocaleString()
              : "Run a sync to populate"
          }
          icon={Clock}
        />
      </div>
    </section>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
