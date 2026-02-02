import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Sidebar, TopBar } from "@/components/admin/layout";

// ============================================================================
// Authenticated Admin Layout
// ============================================================================

/**
 * Layout wrapper for all authenticated admin pages.
 * Includes sidebar and top bar navigation.
 */
export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />

      <div className="flex flex-1 flex-col">
        <TopBar user={user} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
