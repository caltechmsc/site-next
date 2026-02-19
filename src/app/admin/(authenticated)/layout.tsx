import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { Sidebar, TopBar, AuthKeepAlive } from "@/components/admin/layout";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: {
    template: `%s | Admin | ${siteConfig.name}`,
    default: `Admin | ${siteConfig.name}`,
  },
  robots: "noindex,nofollow",
};

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
    <div className="fixed inset-0 flex bg-background">
      <AuthKeepAlive />

      <Sidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
