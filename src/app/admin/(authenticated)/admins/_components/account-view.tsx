/**
 * Account View Component
 *
 * Personal account settings for editors.
 * Displays profile info with options to edit name and change password.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditNameDialog } from "./edit-name-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { updateAdmin } from "@/lib/admin/actions";
import type { SessionUser } from "@/lib/auth/types";

// ============================================================================
// Types
// ============================================================================

export interface AccountViewProps {
  /** Current authenticated user */
  user: SessionUser;
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  update: {
    success: "Profile updated successfully",
    error: "Failed to update profile",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function AccountView({ user }: AccountViewProps) {
  const router = useRouter();

  // Edit name dialog state
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Change password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleNameSubmit = React.useCallback(
    async (name: string) => {
      setIsSubmitting(true);

      try {
        const result = await updateAdmin({
          id: user.id,
          name,
        });
        if (result.success) {
          toast.success(MESSAGES.update.success);
          setEditDialogOpen(false);
          router.refresh();
        } else {
          toast.error(result.error || MESSAGES.update.error);
        }
      } catch {
        toast.error(MESSAGES.update.error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user.id, router]
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <>
      {/* Profile Card */}
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="flex items-center gap-4 border-b p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {user.role}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Name</span>
            <span className="ml-auto font-medium">{user.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email</span>
            <span className="ml-auto font-medium">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary" className="ml-auto capitalize">
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t p-6">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Name
          </Button>
          <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Edit Name Dialog */}
      <EditNameDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentName={user.name}
        onSubmit={handleNameSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  );
}
