/**
 * Stats Grid Component
 *
 * Displays aggregated site statistics in a responsive card grid.
 */

"use client";

import {
  Users,
  FileText,
  FlaskConical,
  Handshake,
  Camera,
  ShieldCheck,
} from "lucide-react";

import { StatCard } from "@/components/admin/dashboard";
import type { DashboardData } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface StatsGridProps {
  /** Aggregated statistics from the server */
  stats: DashboardData["stats"];
}

// ============================================================================
// Component
// ============================================================================

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        Overview
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Members"
          value={stats.members.total}
          description={`${stats.members.visible} visible · ${stats.members.hidden} hidden`}
          icon={Users}
          href="/admin/members"
        />
        <StatCard
          title="Publications"
          value={stats.publications.total}
          description={`${stats.publications.totalCitations.toLocaleString()} total citations`}
          icon={FileText}
        />
        <StatCard
          title="Research Areas"
          value={stats.researchAreas.total}
          description={`${stats.researchAreas.topLevel} top-level areas`}
          icon={FlaskConical}
          href="/admin/research"
        />
        <StatCard
          title="Collaborators"
          value={stats.collaborators.total}
          description={`${stats.collaborators.countries} countries`}
          icon={Handshake}
          href="/admin/collaborators"
        />
        <StatCard
          title="Group Photos"
          value={stats.photos.total}
          description="Event & group photos"
          icon={Camera}
          href="/admin/photos"
        />
        <StatCard
          title="Administrators"
          value={stats.admins.total}
          description="System administrators"
          icon={ShieldCheck}
          href="/admin/admins"
        />
      </div>
    </section>
  );
}
