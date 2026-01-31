import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

// ============================================================================
// Authenticated Admin Layout
// ============================================================================

/**
 * Layout for authenticated admin pages.
 * Redirects to login if not authenticated.
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

  return <>{children}</>;
}
