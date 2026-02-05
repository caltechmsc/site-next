import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Sidebar, TopBar, AuthKeepAlive } from "@/components/admin/layout";

// ============================================================================
// Route Config
// ============================================================================

export const dynamic = "force-dynamic";

// ============================================================================
// Authenticated Admin Layout
// ============================================================================

/**
 * Layout wrapper for all authenticated admin pages.
 * Includes sidebar, top bar, and auth keep-alive for session management.
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
      <AuthKeepAlive />

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
