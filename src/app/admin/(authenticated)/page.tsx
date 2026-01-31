import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

// ============================================================================
// Admin Dashboard
// ============================================================================

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
        <p className="mt-2 text-muted-foreground">
          Admin Dashboard · Coming Soon
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Role: <span className="font-medium">{user.role}</span>
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
