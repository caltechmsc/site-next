import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { PageHeader } from "@/components/admin/layout";
import { MemberListSkeleton } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { getMembers, getCategories } from "@/lib/admin/actions";
import { MemberList } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "Members",
  description: "Manage team members and their profiles",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function MembersPage() {
  const [membersResult, categoriesResult] = await Promise.all([
    getMembers(),
    getCategories(),
  ]);

  if (!membersResult.success) {
    throw new Error(membersResult.error);
  }

  if (!categoriesResult.success) {
    throw new Error(categoriesResult.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage team members, their profiles, and display order."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/members/categories">
              <Settings className="h-4 w-4" />
              <span>Manage Categories</span>
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<MemberListSkeleton />}>
        <MemberList
          members={membersResult.data}
          categories={categoriesResult.data}
        />
      </Suspense>
    </div>
  );
}
