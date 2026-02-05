import { getDashboardStats } from "@/lib/admin/actions";
import { PublicationChart, RecentActivity, StatsGrid } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: "Dashboard | Admin",
  description: "Overview of your site content and activity",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success) {
    throw new Error(result.error);
  }

  const { stats, publicationsByYear, recentMembers, recentPublications } =
    result.data;

  return (
    <div className="space-y-8">
      {/* Publications Chart */}
      <PublicationChart data={publicationsByYear} />

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Recent Activity */}
      <RecentActivity
        recentMembers={recentMembers}
        recentPublications={recentPublications}
      />
    </div>
  );
}
