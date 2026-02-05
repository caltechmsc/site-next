/**
 * Admin List Component
 *
 * Main container for administrator management.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { AdminRow } from "./admin-row";
import { AdminFormDialog } from "./admin-form-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  type AdminListItem,
} from "@/lib/admin/actions";
import type { AdminCreateInput, AdminUpdateInput } from "@/lib/admin/schemas";

// ============================================================================
// Types
// ============================================================================

export interface AdminListProps {
  /** Initial admins from server */
  admins: AdminListItem[];
  /** Current user's ID for self-identification */
  currentUserId: string;
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  create: {
    success: "Administrator created successfully",
    error: "Failed to create administrator",
  },
  update: {
    success: "Administrator updated successfully",
    error: "Failed to update administrator",
  },
  delete: {
    success: (name: string) => `"${name}" has been deleted`,
    error: "Failed to delete administrator",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function AdminList({
  admins: initialAdmins,
  currentUserId,
}: AdminListProps) {
  const router = useRouter();

  // Local state for optimistic updates
  const [admins, setAdmins] = React.useState(initialAdmins);

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingAdmin, setEditingAdmin] = React.useState<AdminListItem | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Change password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<AdminListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleNew = React.useCallback(() => {
    setEditingAdmin(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((admin: AdminListItem) => {
    setEditingAdmin(admin);
    setFormDialogOpen(true);
  }, []);

  const handleChangePassword = React.useCallback(() => {
    setPasswordDialogOpen(true);
  }, []);

  const handleFormSubmit = React.useCallback(
    async (values: AdminCreateInput | AdminUpdateInput) => {
      setIsSubmitting(true);

      try {
        if (editingAdmin) {
          const result = await updateAdmin({
            id: editingAdmin.id,
            ...values,
          });
          if (result.success) {
            toast.success(MESSAGES.update.success);
            setFormDialogOpen(false);
            router.refresh();
          } else {
            toast.error(result.error || MESSAGES.update.error);
          }
        } else {
          const result = await createAdmin(values as AdminCreateInput);
          if (result.success) {
            toast.success(MESSAGES.create.success);
            setFormDialogOpen(false);
            router.refresh();
          } else {
            toast.error(result.error || MESSAGES.create.error);
          }
        }
      } catch {
        toast.error(
          editingAdmin ? MESSAGES.update.error : MESSAGES.create.error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingAdmin, router]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deleteAdmin({ id: deleteTarget.id });
      if (result.success) {
        toast.success(MESSAGES.delete.success(deleteTarget.name));
        router.refresh();
      } else {
        toast.error(result.error || MESSAGES.delete.error);
      }
    } catch {
      toast.error(MESSAGES.delete.error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, router]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (admins.length === 0) {
    return (
      <>
        <EmptyState
          icon={ShieldCheck}
          title="No administrators yet"
          description="Create an administrator account to manage the site"
          action={
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Administrator
            </Button>
          }
        />
        <AdminFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          admin={editingAdmin}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Administrators have full access to all settings.
        Editors can manage content but cannot modify system settings or other
        accounts.
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Administrator
        </Button>
      </div>

      {/* Admin List */}
      <div className="space-y-2">
        {admins.map((admin) => (
          <AdminRow
            key={admin.id}
            admin={admin}
            isSelf={admin.id === currentUserId}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onChangePassword={handleChangePassword}
          />
        ))}
      </div>

      {/* Form Dialog */}
      <AdminFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        admin={editingAdmin}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Administrator"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
