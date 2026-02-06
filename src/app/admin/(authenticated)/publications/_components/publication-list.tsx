/**
 * Publication List Component
 *
 * Main container for publication management.
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
import { Plus, FileText, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { PublicationRow } from "./publication-row";
import { PublicationFormDialog } from "./publication-form-dialog";
import {
  createPublication,
  updatePublication,
  deletePublication,
  reorderPublications,
  getPublicationById,
  type AdminPublicationListItem,
  type PublicationFull,
} from "@/lib/admin/actions";
import type { PublicationInput } from "@/lib/admin/schemas";

// ============================================================================
// Types
// ============================================================================

export type PublicationListItem = AdminPublicationListItem;

export interface PublicationListProps {
  /** Initial publications from server (ordered by index desc) */
  publications: AdminPublicationListItem[];
  /** Known journals for autocomplete */
  journals: string[];
  /** Known authors for autocomplete */
  authors: string[];
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  create: {
    success: "Publication created successfully",
    error: "Failed to create publication",
  },
  update: {
    success: "Publication updated successfully",
    error: "Failed to update publication",
  },
  delete: {
    success: (title: string) => {
      const short = title.length > 50 ? title.slice(0, 50) + "…" : title;
      return `"${short}" has been deleted`;
    },
    error: "Failed to delete publication",
  },
  reorder: {
    error: "Failed to save order",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function PublicationList({
  publications: initialPublications,
  journals,
  authors,
}: PublicationListProps) {
  const router = useRouter();

  const dndContextId = React.useId();

  // Local state for optimistic updates
  const [publications, setPublications] = React.useState(initialPublications);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingPublication, setEditingPublication] =
    React.useState<PublicationFull | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingPublication, setIsLoadingPublication] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] =
    React.useState<AdminPublicationListItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setPublications(initialPublications);
  }, [initialPublications]);

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
  // Filter
  // --------------------------------------------------------------------------

  const filteredPublications = React.useMemo(() => {
    if (!searchQuery.trim()) return publications;

    const query = searchQuery.toLowerCase();
    return publications.filter((p) => {
      return (
        p.title.toLowerCase().includes(query) ||
        p.authors.toLowerCase().includes(query) ||
        (p.journal && p.journal.toLowerCase().includes(query)) ||
        (p.doi && p.doi.toLowerCase().includes(query)) ||
        p.index.toString() === query
      );
    });
  }, [publications, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleNew = React.useCallback(() => {
    setEditingPublication(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(
    async (publication: AdminPublicationListItem) => {
      setIsLoadingPublication(true);
      setFormDialogOpen(true);

      try {
        const result = await getPublicationById({ id: publication.id });
        if (result.success) {
          setEditingPublication(result.data);
        } else {
          toast.error("Failed to load publication data");
          setFormDialogOpen(false);
        }
      } catch {
        toast.error("Failed to load publication data");
        setFormDialogOpen(false);
      } finally {
        setIsLoadingPublication(false);
      }
    },
    []
  );

  const handleFormSubmit = React.useCallback(
    async (values: PublicationInput) => {
      setIsSubmitting(true);

      try {
        if (editingPublication) {
          const result = await updatePublication({
            id: editingPublication.id,
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
          const result = await createPublication(values);
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
          editingPublication ? MESSAGES.update.error : MESSAGES.create.error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingPublication, router]
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = publications.findIndex((p) => p.id === active.id);
      const newIndex = publications.findIndex((p) => p.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(publications, oldIndex, newIndex);

      // Optimistic update
      setPublications(reordered);

      try {
        const totalCount = reordered.length;
        const result = await reorderPublications({
          items: reordered.map((p, i) => ({
            id: p.id,
            order: totalCount - i,
          })),
        });

        if (!result.success) {
          setPublications(initialPublications);
          toast.error(result.error || MESSAGES.reorder.error);
        } else {
          router.refresh();
        }
      } catch {
        setPublications(initialPublications);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [publications, initialPublications, router]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deletePublication({ id: deleteTarget.id });
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

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Empty state
  if (publications.length === 0) {
    return (
      <>
        <EmptyState
          icon={FileText}
          title="No publications yet"
          description="Add research publications to display on the public site"
          action={
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Publication
            </Button>
          }
        />
        <PublicationFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          publication={editingPublication}
          journals={journals}
          authors={authors}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          isLoading={isLoadingPublication}
        />
      </>
    );
  }

  const itemIds = publications.map((p) => p.id);

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Drag publications to reorder. The index determines
        the display order on the public site. Higher index = newer.
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, journal, DOI..."
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredPublications.length} of {publications.length}
        </span>
        <div className="flex-1" />
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Publication
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
        <SortableContext
          items={isSearching ? [] : itemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {filteredPublications.map((publication) => (
              <PublicationRow
                key={publication.id}
                publication={publication}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                isDndDisabled={isSearching}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Form Dialog */}
      <PublicationFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        publication={editingPublication}
        journals={journals}
        authors={authors}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isLoading={isLoadingPublication}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Publication"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${
                deleteTarget.title.length > 80
                  ? deleteTarget.title.slice(0, 80) + "…"
                  : deleteTarget.title
              }"? This will also remove all member and research area associations.`
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
