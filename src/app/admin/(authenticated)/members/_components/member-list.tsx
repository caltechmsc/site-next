/**
 * Member List Component
 *
 * Main container for member management.
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
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, EmptyState } from "@/components/admin/shared";
import { MemberRow } from "./member-row";
import { MemberFormDialog } from "./member-form-dialog";
import {
  createMember,
  updateMember,
  deleteMember,
  toggleMemberHidden,
  reorderMembers,
  getMemberById,
  type MemberListItem,
  type MemberWithCategory,
  type CategoryWithCount,
} from "@/lib/admin/actions";
import type { MemberInput } from "@/lib/admin/schemas";
import type { AvatarImageData } from "@/components/admin/shared";

// ============================================================================
// Types
// ============================================================================

export interface MemberListProps {
  /** Initial members from server */
  members: MemberListItem[];
  /** Available categories for the form */
  categories: CategoryWithCount[];
}

export interface MemberFormValues extends MemberInput {
  imageData?: AvatarImageData | null;
}

/** Members grouped by category */
interface MemberGroup {
  category: {
    id: string;
    name: string;
  };
  members: MemberListItem[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Group members by their category, maintaining category order.
 */
function groupMembersByCategory(
  members: MemberListItem[],
  categories: CategoryWithCount[]
): MemberGroup[] {
  // Create a map of category ID to members
  const membersByCategory = new Map<string, MemberListItem[]>();

  for (const member of members) {
    const categoryId = member.category.id;
    if (!membersByCategory.has(categoryId)) {
      membersByCategory.set(categoryId, []);
    }
    membersByCategory.get(categoryId)!.push(member);
  }

  // Build groups in category order
  const groups: MemberGroup[] = [];

  for (const category of categories) {
    const categoryMembers = membersByCategory.get(category.id);
    if (categoryMembers && categoryMembers.length > 0) {
      groups.push({
        category: { id: category.id, name: category.name },
        members: categoryMembers,
      });
    }
  }

  return groups;
}

// ============================================================================
// Constants
// ============================================================================

const MESSAGES = {
  create: {
    success: "Member created successfully",
    error: "Failed to create member",
  },
  update: {
    success: "Member updated successfully",
    error: "Failed to update member",
  },
  delete: {
    success: (name: string) => `"${name}" has been deleted`,
    error: "Failed to delete member",
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

export function MemberList({
  members: initialMembers,
  categories,
}: MemberListProps) {
  const router = useRouter();

  const dndContextId = React.useId();

  // Local state for optimistic updates
  const [members, setMembers] = React.useState(initialMembers);

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingMember, setEditingMember] =
    React.useState<MemberWithCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingMember, setIsLoadingMember] = React.useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<MemberListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync with server data when it changes
  React.useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

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
    setEditingMember(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(async (member: MemberListItem) => {
    setIsLoadingMember(true);
    setFormDialogOpen(true);

    try {
      const result = await getMemberById({ id: member.id });
      if (result.success) {
        setEditingMember(result.data);
      } else {
        toast.error("Failed to load member data");
        setFormDialogOpen(false);
      }
    } catch {
      toast.error("Failed to load member data");
      setFormDialogOpen(false);
    } finally {
      setIsLoadingMember(false);
    }
  }, []);

  const handleFormSubmit = React.useCallback(
    async (values: MemberFormValues) => {
      setIsSubmitting(true);

      try {
        if (editingMember) {
          // Update existing
          const result = await updateMember({
            id: editingMember.id,
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
          const result = await createMember(values);
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
          editingMember ? MESSAGES.update.error : MESSAGES.create.error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingMember, router]
  );

  const handleToggleHidden = React.useCallback(
    async (member: MemberListItem) => {
      const newHiddenState = !member.isHidden;

      // Optimistic update
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isHidden: newHiddenState } : m
        )
      );

      try {
        const result = await toggleMemberHidden({
          id: member.id,
          isHidden: newHiddenState,
        });

        if (result.success) {
          toast.success(
            newHiddenState
              ? MESSAGES.visibility.hidden(member.name)
              : MESSAGES.visibility.visible(member.name)
          );
        } else {
          // Rollback on error
          setMembers(initialMembers);
          toast.error(result.error || MESSAGES.visibility.error);
        }
      } catch {
        setMembers(initialMembers);
        toast.error(MESSAGES.visibility.error);
      }
    },
    [initialMembers]
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      // Find the dragged member and the target member
      const draggedMember = members.find((m) => m.id === active.id);
      const targetMember = members.find((m) => m.id === over.id);

      if (!draggedMember || !targetMember) return;

      // Check if dragging across categories - if so, snap back immediately
      if (draggedMember.category.id !== targetMember.category.id) {
        // Force re-render to snap back (no state change needed,
        // DnD will handle the visual reset)
        return;
      }

      // Same category - proceed with reorder
      const oldIndex = members.findIndex((m) => m.id === active.id);
      const newIndex = members.findIndex((m) => m.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(members, oldIndex, newIndex);

      // Optimistic update
      setMembers(reordered);

      try {
        const result = await reorderMembers({
          items: reordered.map((m, i) => ({ id: m.id, order: i })),
        });

        if (!result.success) {
          setMembers(initialMembers);
          toast.error(result.error || MESSAGES.reorder.error);
        }
      } catch {
        setMembers(initialMembers);
        toast.error(MESSAGES.reorder.error);
      }
    },
    [members, initialMembers]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const result = await deleteMember({ id: deleteTarget.id });
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
  if (members.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add team members to display on the public site"
          action={
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          }
        />
        <MemberFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          member={editingMember}
          categories={categories}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          isLoading={isLoadingMember}
        />
      </>
    );
  }

  const itemIds = members.map((m) => m.id);
  const memberGroups = groupMembersByCategory(members, categories);

  return (
    <>
      {/* Info Banner */}
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        <strong>Tip:</strong> Drag members to reorder within their category. The
        order here determines how they appear on the public site.
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Sortable List - Grouped by Category */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {memberGroups.map((group) => (
              <div key={group.category.id} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {group.category.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {group.members.length}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Members in this category */}
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      onEdit={handleEdit}
                      onDelete={setDeleteTarget}
                      onToggleHidden={handleToggleHidden}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Form Dialog */}
      <MemberFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        member={editingMember}
        categories={categories}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isLoading={isLoadingMember}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Member"
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
