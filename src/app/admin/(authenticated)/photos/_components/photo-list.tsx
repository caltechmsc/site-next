/**
 * Photo List Component
 *
 * Main container for group photo management.
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
import { Upload, Camera, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { PhotoRow } from "./photo-row";
import { PhotoFormDialog } from "./photo-form-dialog";
import { PhotoUploadDialog } from "./photo-upload-dialog";
import {
  updatePhoto,
  deletePhoto,
  reorderPhotos,
  type PhotoListItem,
} from "@/lib/admin/actions";
import type { PhotoInput } from "@/lib/admin/schemas";
import { getYear } from "@/lib/date";

// ============================================================================
// Types
// ============================================================================

export interface PhotoListProps {
  /** Initial photos from server */
  photos: PhotoListItem[];
}

export interface PhotoFormValues extends PhotoInput {
  imageData?: { base64: string; filename: string; mimeType: string } | null;
}

/** Photos grouped by year */
interface PhotoGroup {
  year: number;
  photos: PhotoListItem[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Group photos by year, sorted by year descending.
 * Photos within each year are sorted by order ascending.
 */
function groupPhotosByYear(photos: PhotoListItem[]): PhotoGroup[] {
  const byYear = new Map<number, PhotoListItem[]>();

  for (const photo of photos) {
    const year = getYear(photo.date);
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(photo);
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, yearPhotos]) => ({
      year,
      photos: yearPhotos.sort((a, b) => a.order - b.order),
    }));
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  update: {
    success: "Photo updated successfully",
    error: "Failed to update photo",
  },
  delete: {
    success: "Photo has been deleted",
    error: "Failed to delete photo",
  },
  reorder: {
    error: "Failed to save order",
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function PhotoList({ photos: initialPhotos }: PhotoListProps) {
  const router = useRouter();

  const dndContextId = React.useId();

  // Local state for optimistic updates
  const [photos, setPhotos] = React.useState(initialPhotos);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingPhoto, setEditingPhoto] = React.useState<PhotoListItem | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<PhotoListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Year groups
  const photoGroups = React.useMemo(() => groupPhotosByYear(photos), [photos]);

  // Collapsible years - default: only most recent year expanded
  const [expandedYears, setExpandedYears] = React.useState<Set<number>>(() => {
    const groups = groupPhotosByYear(initialPhotos);
    if (groups.length > 0) {
      return new Set([groups[0].year]);
    }
    return new Set();
  });

  // Sync with server data when it changes
  React.useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Visible item IDs for SortableContext (only expanded years)
  const visibleItemIds = React.useMemo(() => {
    return photoGroups
      .filter((g) => expandedYears.has(g.year))
      .flatMap((g) => g.photos.map((p) => p.id));
  }, [photoGroups, expandedYears]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const toggleYear = React.useCallback((year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }, []);

  const handleUploadComplete = React.useCallback(
    (uploadDate: string) => {
      // Expand the year that photos were uploaded to
      const year = getYear(uploadDate);
      setExpandedYears((prev) => new Set([...prev, year]));
      router.refresh();
    },
    [router]
  );

  const handleEdit = React.useCallback((photo: PhotoListItem) => {
    setEditingPhoto(photo);
    setFormDialogOpen(true);
  }, []);

  const handleFormSubmit = React.useCallback(
    async (values: PhotoFormValues) => {
      if (!editingPhoto) return;

      setIsSubmitting(true);

      try {
        const result = await updatePhoto({
          id: editingPhoto.id,
          ...values,
        });
        if (result.success) {
          toast.success(MESSAGES.update.success);
          setFormDialogOpen(false);

          // Expand the target year in case date changed
          const newYear = getYear(values.date);
          setExpandedYears((prev) => new Set([...prev, newYear]));

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
    [editingPhoto, router]
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const draggedPhoto = photos.find((p) => p.id === active.id);
      const targetPhoto = photos.find((p) => p.id === over.id);

      if (!draggedPhoto || !targetPhoto) return;

      // Only allow reorder within same year
      if (getYear(draggedPhoto.date) !== getYear(targetPhoto.date)) return;

      // Find the year group
      const year = getYear(draggedPhoto.date);
      const group = photoGroups.find((g) => g.year === year);

      if (!group) return;

      // Find indices within the year group
      const oldIndex = group.photos.findIndex((p) => p.id === active.id);
      const newIndex = group.photos.findIndex((p) => p.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder within the group
      const reorderedGroup = arrayMove(group.photos, oldIndex, newIndex);

      // Optimistic update - rebuild the full photos array
      setPhotos((prev) => {
        const otherPhotos = prev.filter((p) => getYear(p.date) !== year);
        const updatedGroupPhotos = reorderedGroup.map((p, i) => ({
          ...p,
          order: i,
        }));
        return [...otherPhotos, ...updatedGroupPhotos];
      });

      // Send reorder to server
      try {
        const result = await reorderPhotos({
          items: reorderedGroup.map((p, i) => ({ id: p.id, order: i })),
        });

        if (!result.success) {
          setPhotos(initialPhotos);
          toast.error(result.error || MESSAGES.reorder.error);
        }
      } catch {
        setPhotos(initialPhotos);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [photos, photoGroups, initialPhotos]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deletePhoto({ id: deleteTarget.id });
      if (result.success) {
        toast.success(MESSAGES.delete.success);
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
  if (photos.length === 0) {
    return (
      <>
        <EmptyState
          icon={Camera}
          title="No photos yet"
          description="Upload group photos to showcase on the public site"
          action={
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          }
        />
        <PhotoUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Drag photos to reorder within the same year. Click
        a year header to expand or collapse that section.
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Photos
        </Button>
      </div>

      {/* Sortable List - Grouped by Year */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleItemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {photoGroups.map((group) => {
              const isExpanded = expandedYears.has(group.year);

              return (
                <div key={group.year} className="space-y-2">
                  {/* Year Header */}
                  <button
                    type="button"
                    onClick={() => toggleYear(group.year)}
                    className="flex w-full items-center gap-3"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {group.year}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {group.photos.length}{" "}
                      {group.photos.length === 1 ? "photo" : "photos"}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </button>

                  {/* Photos in this year */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {group.photos.map((photo) => (
                        <PhotoRow
                          key={photo.id}
                          photo={photo}
                          onEdit={handleEdit}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Upload Dialog */}
      <PhotoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />

      {/* Form Dialog */}
      <PhotoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        photo={editingPhoto}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Photo"
        description={
          deleteTarget
            ? "Are you sure you want to delete this photo? This action cannot be undone."
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
