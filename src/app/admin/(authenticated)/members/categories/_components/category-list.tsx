/**
 * Category List Component
 *
 * Main container for category management.
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
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { CategoryRow } from "./category-row";
import { CategoryFormDialog } from "./category-form-dialog";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  type CategoryWithCount,
} from "@/lib/admin/actions";
import type { CategoryInput } from "@/lib/admin/schemas";

// ============================================================================
// Types
// ============================================================================

export interface CategoryListProps {
  /** Initial categories from server */
  categories: CategoryWithCount[];
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  create: {
    success: "Category created successfully",
    error: "Failed to create category",
  },
  update: {
    success: "Category updated successfully",
    error: "Failed to update category",
  },
  delete: {
    success: (name: string) => `"${name}" has been deleted`,
    error: "Failed to delete category",
  },
  reorder: {
    error: "Failed to save order",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function CategoryList({
  categories: initialCategories,
}: CategoryListProps) {
  const router = useRouter();

  const dndContextId = React.useId();

  // Local state for optimistic updates
  const [categories, setCategories] = React.useState(initialCategories);

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<CategoryWithCount | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] =
    React.useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

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
    setEditingCategory(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((category: CategoryWithCount) => {
    setEditingCategory(category);
    setFormDialogOpen(true);
  }, []);

  const handleFormSubmit = React.useCallback(
    async (values: CategoryInput) => {
      setIsSubmitting(true);

      try {
        if (editingCategory) {
          // Update existing
          const result = await updateCategory({
            id: editingCategory.id,
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
          const result = await createCategory(values);
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
          editingCategory ? MESSAGES.update.error : MESSAGES.create.error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingCategory, router]
  );

  const handleToggleDefault = React.useCallback(
    async (category: CategoryWithCount) => {
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, showByDefault: !c.showByDefault } : c
        )
      );

      try {
        const result = await updateCategory({
          id: category.id,
          name: category.name,
          showByDefault: !category.showByDefault,
        });

        if (!result.success) {
          // Rollback on error
          setCategories(initialCategories);
          toast.error(result.error || MESSAGES.update.error);
        }
      } catch {
        setCategories(initialCategories);
        toast.error(MESSAGES.update.error);
      }
    },
    [initialCategories]
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(categories, oldIndex, newIndex);

      // Optimistic update
      setCategories(reordered);

      try {
        const result = await reorderCategories({
          items: reordered.map((c, i) => ({ id: c.id, order: i })),
        });

        if (!result.success) {
          setCategories(initialCategories);
          toast.error(result.error || MESSAGES.reorder.error);
        }
      } catch {
        setCategories(initialCategories);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [categories, initialCategories]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deleteCategory({ id: deleteTarget.id });
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

  // Empty state
  if (categories.length === 0) {
    return (
      <>
        <EmptyState
          icon={FolderOpen}
          title="No categories yet"
          description="Create categories to organize your team members by role or status"
          action={
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          }
        />
        <CategoryFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          category={editingCategory}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }

  const itemIds = categories.map((c) => c.id);

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Drag categories to reorder. The order here
        determines how they appear on the public members page.
        &quot;Default&quot; categories are shown initially.
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
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
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleDefault={handleToggleDefault}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Form Dialog */}
      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        category={editingCategory}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category"
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
