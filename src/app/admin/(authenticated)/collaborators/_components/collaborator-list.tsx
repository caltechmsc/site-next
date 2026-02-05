/**
 * Collaborator List Component
 *
 * Main container for collaborator management.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { CollaboratorRow } from "./collaborator-row";
import { CollaboratorFormDialog } from "./collaborator-form-dialog";
import {
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
  toggleCollaboratorHidden,
  reorderCollaborators,
  type CollaboratorListItem,
} from "@/lib/admin/actions";
import type { CollaboratorInput } from "@/lib/admin/schemas";

// ============================================================================
// Types
// ============================================================================

export interface CollaboratorListProps {
  /** Initial collaborators from server */
  collaborators: CollaboratorListItem[];
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  create: {
    success: "Collaborator created successfully",
    error: "Failed to create collaborator",
  },
  update: {
    success: "Collaborator updated successfully",
    error: "Failed to update collaborator",
  },
  delete: {
    success: (name: string) => `"${name}" has been deleted`,
    error: "Failed to delete collaborator",
  },
  reorder: {
    error: "Failed to save order",
  },
  visibility: {
    hidden: (name: string) => `"${name}" is now hidden`,
    visible: (name: string) => `"${name}" is now visible`,
    error: "Failed to update visibility",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function CollaboratorList({
  collaborators: initialCollaborators,
}: CollaboratorListProps) {
  const router = useRouter();

  const dndContextId = React.useId();

  // Local state for optimistic updates
  const [collaborators, setCollaborators] =
    React.useState(initialCollaborators);

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCollaborator, setEditingCollaborator] =
    React.useState<CollaboratorListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] =
    React.useState<CollaboratorListItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setCollaborators(initialCollaborators);
  }, [initialCollaborators]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleNew = React.useCallback(() => {
    setEditingCollaborator(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((collaborator: CollaboratorListItem) => {
    setEditingCollaborator(collaborator);
    setFormDialogOpen(true);
  }, []);

  const handleFormSubmit = React.useCallback(
    async (values: CollaboratorInput) => {
      setIsSubmitting(true);

      try {
        if (editingCollaborator) {
          // Update existing
          const result = await updateCollaborator({
            id: editingCollaborator.id,
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
          // Create new
          const result = await createCollaborator(values);
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
          editingCollaborator ? MESSAGES.update.error : MESSAGES.create.error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingCollaborator, router]
  );

  const handleToggleHidden = React.useCallback(
    async (collaborator: CollaboratorListItem) => {
      const newHiddenState = !collaborator.isHidden;

      // Optimistic update
      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === collaborator.id ? { ...c, isHidden: newHiddenState } : c
        )
      );

      try {
        const result = await toggleCollaboratorHidden({
          id: collaborator.id,
          isHidden: newHiddenState,
        });

        if (result.success) {
          toast.success(
            newHiddenState
              ? MESSAGES.visibility.hidden(collaborator.organization)
              : MESSAGES.visibility.visible(collaborator.organization)
          );
        } else {
          // Rollback on error
          setCollaborators(initialCollaborators);
          toast.error(result.error || MESSAGES.visibility.error);
        }
      } catch {
        setCollaborators(initialCollaborators);
        toast.error(MESSAGES.visibility.error);
      }
    },
    [initialCollaborators]
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = collaborators.findIndex((c) => c.id === active.id);
      const newIndex = collaborators.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(collaborators, oldIndex, newIndex);

      // Optimistic update
      setCollaborators(reordered);

      try {
        const result = await reorderCollaborators({
          items: reordered.map((c, i) => ({ id: c.id, order: i })),
        });

        if (!result.success) {
          setCollaborators(initialCollaborators);
          toast.error(result.error || MESSAGES.reorder.error);
        }
      } catch {
        setCollaborators(initialCollaborators);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [collaborators, initialCollaborators]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deleteCollaborator({ id: deleteTarget.id });
      if (result.success) {
        toast.success(MESSAGES.delete.success(deleteTarget.organization));
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

  // Empty state
  if (collaborators.length === 0) {
    return (
      <>
        <EmptyState
          icon={Building2}
          title="No collaborators yet"
          description="Add research collaborators and partners to display on the public site"
          action={
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Collaborator
            </Button>
          }
        />
        <CollaboratorFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          collaborator={editingCollaborator}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }

  const itemIds = collaborators.map((c) => c.id);

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Drag collaborators to reorder. Collaborators with
        coordinates will appear on the interactive map.
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collaborator
        </Button>
      </div>

      {/* Sortable List */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <CollaboratorRow
                key={collaborator.id}
                collaborator={collaborator}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleHidden={handleToggleHidden}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Form Dialog */}
      <CollaboratorFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        collaborator={editingCollaborator}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Collaborator"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.organization}"? This action cannot be undone.`
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
