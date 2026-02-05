import { Suspense } from "react";

import { PageHeader } from "@/components/admin/layout";
import { AdminListSkeleton } from "@/components/admin/shared";
import { getCurrentUser } from "@/lib/auth";
import { getAdmins } from "@/lib/admin/actions";
import { AdminList, AccountView } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: "Administrators | Admin",
  description: "Manage administrator accounts and roles",
};

// ============================================================================
// Page Component
// ============================================================================

export default async function AdminsPage() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  // Editor view: account settings only
  if (user.role === "editor") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Account"
          description="Manage your account settings and password."
        />

        <AccountView user={user} />
      </div>
    );
  }

  // Admin view: full administrator management
  const result = await getAdmins();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrators"
        description="Manage administrator accounts, roles, and permissions."
      />

      <Suspense fallback={<AdminListSkeleton />}>
        <AdminList admins={result.data} currentUserId={user.id} />
      </Suspense>
    </div>
  );
}
