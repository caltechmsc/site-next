/**
 * Research List Component
 *
 * Main container for research area management.
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
import { Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { ResearchRow } from "./research-row";
import { ResearchFormDialog } from "./research-form-dialog";
import {
  createResearchArea,
  updateResearchArea,
  deleteResearchArea,
  toggleResearchAreaHidden,
  reorderResearchAreas,
  getResearchAreaById,
  type ResearchAreaWithChildren,
  type ResearchAreaListItem,
  type ResearchAreaFull,
  type ParentOption,
} from "@/lib/admin/actions";
import type { ResearchAreaInput } from "@/lib/admin/schemas";

// ============================================================================
// Types
// ============================================================================

export interface ResearchListProps {
  /** Initial research areas from server */
  areas: ResearchAreaWithChildren[];
  /** Available parent options for the form */
  parentOptions: ParentOption[];
}

export interface ResearchFormValues extends ResearchAreaInput {}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  create: {
    success: "Research area created successfully",
    error: "Failed to create research area",
  },
  update: {
    success: "Research area updated successfully",
    error: "Failed to update research area",
  },
  delete: {
    success: (title: string) => `"${title}" has been deleted`,
    error: "Failed to delete research area",
  },
  reorder: {
    error: "Failed to save order",
  },
  visibility: {
    hidden: (title: string) => `"${title}" is now hidden`,
    visible: (title: string) => `"${title}" is now visible`,
    error: "Failed to update visibility",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function ResearchList({
  areas: initialAreas,
  parentOptions: initialParentOptions,
}: ResearchListProps) {
  const router = useRouter();

  const dndContextId = React.useId();
  const childDndContextId = React.useId();

  // Local state for optimistic updates
  const [areas, setAreas] = React.useState(initialAreas);
  const [parentOptions, setParentOptions] =
    React.useState(initialParentOptions);

  // Expanded state for parent areas
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(initialAreas.map((a) => a.id))
  );

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingArea, setEditingArea] = React.useState<ResearchAreaFull | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingArea, setIsLoadingArea] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<
    ResearchAreaListItem | ResearchAreaWithChildren | null
  >(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setAreas(initialAreas);
  }, [initialAreas]);

  React.useEffect(() => {
    setParentOptions(initialParentOptions);
  }, [initialParentOptions]);

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
  // Helpers
  // --------------------------------------------------------------------------

  // Get all existing slugs for unique slug generation
  const existingSlugs = React.useMemo(() => {
    const slugs: string[] = [];
    for (const area of areas) {
      slugs.push(area.slug);
      for (const child of area.children) {
        slugs.push(child.slug);
      }
    }
    return slugs;
  }, [areas]);

  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Get total count of areas
  const totalAreas = areas.reduce(
    (sum, area) => sum + 1 + area.children.length,
    0
  );

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleNew = React.useCallback((parentId?: string | null) => {
    setEditingArea(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(
    async (area: ResearchAreaListItem | ResearchAreaWithChildren) => {
      setIsLoadingArea(true);
      setFormDialogOpen(true);

      try {
        const result = await getResearchAreaById({ id: area.id });
        if (result.success) {
          setEditingArea(result.data);
        } else {
          toast.error("Failed to load research area data");
          setFormDialogOpen(false);
        }
      } catch {
        toast.error("Failed to load research area data");
        setFormDialogOpen(false);
      } finally {
        setIsLoadingArea(false);
      }
    },
    []
  );

  const handleFormSubmit = React.useCallback(
    async (values: ResearchFormValues) => {
      setIsSubmitting(true);

      try {
        if (editingArea) {
          // Update existing
          const result = await updateResearchArea({
            id: editingArea.id,
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
          const result = await createResearchArea(values);
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
          editingArea ? MESSAGES.update.error : MESSAGES.create.error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingArea, router]
  );

  const handleToggleHidden = React.useCallback(
    async (area: ResearchAreaListItem | ResearchAreaWithChildren) => {
      const newHiddenState = !area.isHidden;

      // Optimistic update
      setAreas((prev) =>
        prev.map((parent) => {
          if (parent.id === area.id) {
            return { ...parent, isHidden: newHiddenState };
          }
          return {
            ...parent,
            children: parent.children.map((child) =>
              child.id === area.id
                ? { ...child, isHidden: newHiddenState }
                : child
            ),
          };
        })
      );

      try {
        const result = await toggleResearchAreaHidden({
          id: area.id,
          isHidden: newHiddenState,
        });

        if (result.success) {
          toast.success(
            newHiddenState
              ? MESSAGES.visibility.hidden(area.title)
              : MESSAGES.visibility.visible(area.title)
          );
        } else {
          // Rollback on error
          setAreas(initialAreas);
          toast.error(result.error || MESSAGES.visibility.error);
        }
      } catch {
        setAreas(initialAreas);
        toast.error(MESSAGES.visibility.error);
      }
    },
    [initialAreas]
  );

  const handleParentDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = areas.findIndex((a) => a.id === active.id);
      const newIndex = areas.findIndex((a) => a.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(areas, oldIndex, newIndex);

      // Optimistic update
      setAreas(reordered);

      try {
        const result = await reorderResearchAreas({
          parentId: null,
          items: reordered.map((a, i) => ({ id: a.id, order: i })),
        });

        if (!result.success) {
          setAreas(initialAreas);
          toast.error(result.error || MESSAGES.reorder.error);
        }
      } catch {
        setAreas(initialAreas);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [areas, initialAreas]
  );

  const handleChildDragEnd = React.useCallback(
    async (parentId: string, event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const parent = areas.find((a) => a.id === parentId);
      if (!parent) return;

      const children = parent.children;
      const draggedChild = children.find((c) => c.id === active.id);
      const targetChild = children.find((c) => c.id === over.id);

      if (!draggedChild || !targetChild) return;

      // Prevent cross-parent drag (should not happen, but safety check)
      if (draggedChild.parentId !== targetChild.parentId) {
        return;
      }

      const oldIndex = children.findIndex((c) => c.id === active.id);
      const newIndex = children.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedChildren = arrayMove(children, oldIndex, newIndex);

      // Optimistic update
      setAreas((prev) =>
        prev.map((a) =>
          a.id === parentId ? { ...a, children: reorderedChildren } : a
        )
      );

      try {
        const result = await reorderResearchAreas({
          parentId,
          items: reorderedChildren.map((c, i) => ({ id: c.id, order: i })),
        });

        if (!result.success) {
          setAreas(initialAreas);
          toast.error(result.error || MESSAGES.reorder.error);
        }
      } catch {
        setAreas(initialAreas);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [areas, initialAreas]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deleteResearchArea({ id: deleteTarget.id });
      if (result.success) {
        toast.success(MESSAGES.delete.success(deleteTarget.title));
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

  // Check if delete target has children
  const deleteTargetHasChildren =
    deleteTarget &&
    "children" in deleteTarget &&
    deleteTarget.children.length > 0;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Empty state
  if (totalAreas === 0) {
    return (
      <>
        <EmptyState
          icon={FlaskConical}
          title="No research areas yet"
          description="Get started by adding your first research area"
          action={
            <Button onClick={() => handleNew()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Research Area
            </Button>
          }
        />
        <ResearchFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          area={editingArea}
          parentOptions={parentOptions}
          existingSlugs={existingSlugs}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          isLoading={isLoadingArea}
        />
      </>
    );
  }

  const parentIds = areas.map((a) => a.id);

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Drag to reorder areas within each level. Sub-areas
        can only be reordered within their parent.
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={() => handleNew()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Research Area
        </Button>
      </div>

      {/* Sortable Tree */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleParentDragEnd}
      >
        <SortableContext
          items={parentIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {areas.map((parent) => {
              const isExpanded = expandedIds.has(parent.id);
              const hasChildren = parent.children.length > 0;
              const childIds = parent.children.map((c) => c.id);

              return (
                <div key={parent.id} className="space-y-2">
                  {/* Parent Row */}
                  <ResearchRow
                    area={parent}
                    isChild={false}
                    isExpanded={isExpanded}
                    hasChildren={hasChildren}
                    onToggleExpand={() => toggleExpanded(parent.id)}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    onToggleHidden={handleToggleHidden}
                  />

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-8 space-y-2">
                      <DndContext
                        id={`${childDndContextId}-${parent.id}`}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={(event) =>
                          handleChildDragEnd(parent.id, event)
                        }
                      >
                        <SortableContext
                          items={childIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {parent.children.map((child) => (
                              <ResearchRow
                                key={child.id}
                                area={child}
                                isChild={true}
                                onEdit={handleEdit}
                                onDelete={setDeleteTarget}
                                onToggleHidden={handleToggleHidden}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  {/* Child Count Badge (collapsed) */}
                  {hasChildren && !isExpanded && (
                    <div className="ml-8 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {parent.children.length} sub-area
                        {parent.children.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Form Dialog */}
      <ResearchFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        area={editingArea}
        parentOptions={parentOptions}
        existingSlugs={existingSlugs}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isLoading={isLoadingArea}
      />

      {/* Delete Confirmation (no children) */}
      <ConfirmDialog
        open={!!deleteTarget && !deleteTargetHasChildren}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Research Area"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? This will also remove all publication and member associations. This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* Cannot Delete Dialog (has children) */}
      <ConfirmDialog
        open={!!deleteTarget && !!deleteTargetHasChildren}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Cannot Delete"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" has sub-areas. Please delete or move the sub-areas first.`
            : ""
        }
        confirmText="OK"
        variant="warning"
        onConfirm={() => setDeleteTarget(null)}
      />
    </>
  );
}
