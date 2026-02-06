/**
 * Member Form Dialog
 *
 * Modal dialog for creating and editing members.
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { AvatarUpload, type AvatarImageData } from "@/components/admin/shared";
import type {
  MemberWithCategory,
  CategoryWithCount,
} from "@/lib/admin/actions";
import { getCurrentDate } from "@/lib/date";
import type { MemberFormValues } from "./member-list";

// ============================================================================
// Types
// ============================================================================

// Form-specific schema with required fields for controlled inputs
const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  aliases: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  website: z.string().url("Invalid URL").or(z.literal("")).optional(),
  position: z.string().optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "Invalid ORCID format")
    .or(z.literal(""))
    .optional(),
  categoryId: z.string().min(1, "Category is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .or(z.literal(""))
    .optional(),
  isHidden: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export interface MemberFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Member to edit (null for create mode) */
  member?: MemberWithCategory | null;
  /** Available categories */
  categories: CategoryWithCount[];
  /** Callback when form is submitted */
  onSubmit: (values: MemberFormValues) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  /** Whether member data is loading */
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
  categories,
  onSubmit,
  isSubmitting = false,
  isLoading = false,
}: MemberFormDialogProps) {
  const isEditing = !!member;

  // Track avatar changes separately (not in react-hook-form)
  const [currentPhoto, setCurrentPhoto] = React.useState<string | null>(null);
  const [imageData, setImageData] = React.useState<AvatarImageData | null>(
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      aliases: "",
      email: "",
      website: "",
      position: "",
      education: "",
      bio: "",
      orcid: "",
      categoryId: categories[0]?.id ?? "",
      startDate: getCurrentDate(),
      endDate: "",
      isHidden: false,
    },
  });

  // Parse aliases from JSON string
  const parseAliases = (aliases: string | null): string => {
    if (!aliases) return "";
    try {
      const parsed = JSON.parse(aliases);
      return Array.isArray(parsed) ? parsed.join(", ") : "";
    } catch {
      return "";
    }
  };

  // Reset form when dialog opens/closes or member changes
  React.useEffect(() => {
    if (open && !isLoading) {
      setCurrentPhoto(member?.photo ?? null);
      setImageData(null);
      form.reset({
        name: member?.name ?? "",
        aliases: parseAliases(member?.aliases ?? null),
        email: member?.email ?? "",
        website: member?.website ?? "",
        position: member?.position ?? "",
        education: member?.education ?? "",
        bio: member?.bio ?? "",
        orcid: member?.orcid ?? "",
        categoryId: member?.categoryId ?? categories[0]?.id ?? "",
        startDate: member?.startDate ?? getCurrentDate(),
        endDate: member?.endDate ?? "",
        isHidden: member?.isHidden ?? false,
      });
    }
  }, [open, member, categories, form, isLoading]);

  const handleAvatarChange = React.useCallback(
    (data: AvatarImageData | null) => {
      if (data) {
        setImageData(data);
        setCurrentPhoto(data.base64); // Preview the new image
      } else {
        setImageData(null);
        setCurrentPhoto(null);
      }
    },
    []
  );

  const handleSubmit = async (values: FormValues) => {
    // Transform form values to API format
    const apiValues: MemberFormValues = {
      name: values.name,
      aliases: values.aliases
        ? values.aliases
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      email: values.email || null,
      photo: currentPhoto,
      website: values.website || null,
      position: values.position || null,
      education: values.education || null,
      bio: values.bio || null,
      orcid: values.orcid || null,
      categoryId: values.categoryId,
      startDate: values.startDate,
      endDate: values.endDate || null,
      isHidden: values.isHidden,
      imageData: imageData,
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
          <DialogTitle>{isEditing ? "Edit Member" : "New Member"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update member information and profile photo."
              : "Add a new team member. They will appear on the public site."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading member data...
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] px-6">
            <Form {...form}>
              <form
                id="member-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 pb-4"
              >
                {/* Avatar Upload */}
                <div className="flex justify-center py-4">
                  <AvatarUpload
                    name={form.watch("name") || "Member"}
                    value={currentPhoto}
                    onChange={handleAvatarChange}
                    disabled={isSubmitting}
                    size="xl"
                  />
                </div>

                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Basic Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full name"
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
                    name="aliases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aliases</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Alternative names, comma-separated"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Used for matching publications (e.g., &quot;J.
                          Smith&quot;, &quot;John S.&quot;)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@example.com"
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
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://..."
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Position & Category Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Position & Category
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Postdoctoral Scholar"
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
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            key={`category-select-${member?.id ?? "new"}`}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave empty if current
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Biography
                  </h3>

                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Ph.D., MIT (2020)"
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
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief biography or research interests..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orcid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ORCID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0000-0000-0000-0000"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Used for automatic publication linking
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
                          Hidden members won&apos;t appear on the public members
                          page
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
            form="member-form"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
