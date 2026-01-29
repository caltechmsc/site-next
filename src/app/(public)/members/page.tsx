import type { Metadata } from "next";

import { getCategoriesWithMembers } from "@/lib/db/queries/members";
import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { MemberListClient } from "./client";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "Members",
  description: pageDescriptions.members,
  path: "/members",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function MembersPage() {
  const categories = await getCategoriesWithMembers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Members</h1>
        <p className="mt-2 text-muted-foreground">
          Researchers, students, and staff at the Materials and Process
          Simulation Center.
        </p>
      </div>

      {/* Member Directory */}
      <MemberListClient categories={categories} />
    </div>
  );
}
