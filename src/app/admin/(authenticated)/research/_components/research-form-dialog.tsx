/**
 * Research Form Dialog
 *
 * Modal dialog for creating and editing research areas.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownEditor } from "@/components/admin/shared";
import { generateUniqueSlug } from "@/lib/admin/utils";
import type { ResearchAreaFull, ParentOption } from "@/lib/admin/actions";
import type { ResearchFormValues } from "./research-list";

// ============================================================================
// Types
// ============================================================================

// Form-specific schema with required fields for controlled inputs
const formSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens only"
    ),
  title: z.string().trim().min(1, "Title is required"),
  keywords: z.string().optional(),
  content: z.string().optional(),
  parentId: z.string().optional(),
  isHidden: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const NO_PARENT = "__none__";

export interface ResearchFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Research area to edit (null for create mode) */
  area?: ResearchAreaFull | null;
  /** Available parent options */
  parentOptions: ParentOption[];
  /** Existing slugs for uniqueness check */
  existingSlugs: string[];
  /** Callback when form is submitted */
  onSubmit: (values: ResearchFormValues) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  /** Whether area data is loading */
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ResearchFormDialog({
  open,
  onOpenChange,
  area,
  parentOptions,
  existingSlugs,
  onSubmit,
  isSubmitting = false,
  isLoading = false,
}: ResearchFormDialogProps) {
  const isEditing = !!area;

  // Filter parent options (exclude self when editing)
  const availableParents = isEditing
    ? parentOptions.filter((p) => p.id !== area.id)
    : parentOptions;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: "",
      title: "",
      keywords: "",
      content: "",
      parentId: NO_PARENT,
      isHidden: false,
    },
  });

  // Auto-generate unique slug from title (only when creating)
  const title = form.watch("title");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing && !slugManuallyEdited && title) {
      // Filter out current area's slug when editing (shouldn't happen in create mode)
      const otherSlugs = existingSlugs;
      form.setValue("slug", generateUniqueSlug(title, otherSlugs));
    }
  }, [title, isEditing, slugManuallyEdited, existingSlugs, form]);

  // Parse keywords from JSON string
  const parseKeywords = (keywords: string | null): string => {
    if (!keywords) return "";
    try {
      const parsed = JSON.parse(keywords);
      return Array.isArray(parsed) ? parsed.join(", ") : "";
    } catch {
      return "";
    }
  };

  // Reset form when dialog opens/closes or area changes
  React.useEffect(() => {
    if (open && !isLoading) {
      setSlugManuallyEdited(isEditing);
      form.reset({
        slug: area?.slug ?? "",
        title: area?.title ?? "",
        keywords: parseKeywords(area?.keywords ?? null),
        content: area?.content ?? "",
        parentId: area?.parentId || NO_PARENT,
        isHidden: area?.isHidden ?? false,
      });
    }
  }, [open, area, form, isLoading, isEditing]);

  const handleSubmit = async (values: FormValues) => {
    // Transform form values to API format
    const apiValues: ResearchFormValues = {
      slug: values.slug,
      title: values.title,
      keywords: values.keywords
        ? values.keywords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      content: values.content || null,
      parentId: values.parentId === NO_PARENT ? null : values.parentId,
      isHidden: values.isHidden,
    };

    await onSubmit(apiValues);
  };

  // Prevent closing while submitting
  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isEditing ? "Edit Research Area" : "New Research Area"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the research area details."
              : "Create a new research area to organize publications and members."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading research area data...
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] px-6">
            <Form {...form}>
              <form
                id="research-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 pb-4"
              >
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Basic Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Machine Learning"
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
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug *</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              /research/
                            </span>
                            <Input
                              placeholder="machine-learning"
                              autoComplete="off"
                              {...field}
                              onChange={(e) => {
                                setSlugManuallyEdited(true);
                                field.onChange(e);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Lowercase letters, numbers, and hyphens only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Area</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          key={`parent-select-${area?.id ?? "new"}`}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_PARENT}>
                              None (Top-level)
                            </SelectItem>
                            {availableParents.map((parent) => (
                              <SelectItem key={parent.id} value={parent.id}>
                                {parent.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Only two levels are supported (parent → child)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., neural networks, deep learning, AI"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Comma-separated keywords for search and filtering
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <MarkdownEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Describe this research area..."
                            minHeight={150}
                          />
                        </FormControl>
                        <FormDescription>
                          Supports Markdown formatting
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Visibility Section */}
                <FormField
                  control={form.control}
                  name="isHidden"
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
                          Hide from public site
                        </FormLabel>
                        <FormDescription>
                          Hidden research areas won&apos;t appear on the public
                          research page
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="research-form"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Research Area"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
