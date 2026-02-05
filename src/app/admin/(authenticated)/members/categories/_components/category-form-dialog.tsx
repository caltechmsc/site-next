/**
 * Category Form Dialog
 *
 * Modal dialog for creating and editing categories.
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CategoryInput } from "@/lib/admin/schemas";
import type { CategoryWithCount } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

// Form-specific schema with required boolean for controlled checkbox
const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  showByDefault: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export interface CategoryFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Category to edit (null for create mode) */
  category?: CategoryWithCount | null;
  /** Callback when form is submitted */
  onSubmit: (values: CategoryInput) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isSubmitting = false,
}: CategoryFormDialogProps) {
  const isEditing = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      showByDefault: true,
    },
  });

  // Reset form when dialog opens/closes or category changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        showByDefault: category?.showByDefault ?? true,
      });
    }
  }, [open, category, form]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  // Prevent closing while submitting
  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category name and visibility settings."
              : "Create a new category to organize your team members."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Faculty, Postdocs, Graduate Students, Undergraduates"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showByDefault"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Show by default
                    </FormLabel>
                    <FormDescription>
                      Display this category when visitors first load the members
                      page
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
