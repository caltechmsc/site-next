/**
 * Photo Form Dialog
 *
 * Modal dialog for editing photo metadata and replacing images.
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { PhotoListItem } from "@/lib/admin/actions";
import type { PhotoFormValues } from "./photo-list";

// ============================================================================
// Types
// ============================================================================

// Form-specific schema with required fields for controlled inputs
const formSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  caption: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface PhotoFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Photo to edit */
  photo?: PhotoListItem | null;
  /** Callback when form is submitted */
  onSubmit: (values: PhotoFormValues) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Component
// ============================================================================

export function PhotoFormDialog({
  open,
  onOpenChange,
  photo,
  onSubmit,
  isSubmitting = false,
}: PhotoFormDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Image replacement state (separate from form)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageData, setImageData] = React.useState<{
    base64: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: "",
      caption: "",
    },
  });

  // Reset form when dialog opens/closes or photo changes
  React.useEffect(() => {
    if (open && photo) {
      form.reset({
        date: photo.date,
        caption: photo.caption ?? "",
      });
      setImagePreview(photo.imageUrl);
      setImageData(null);
    }
  }, [open, photo, form]);

  const handleImageSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > MAX_FILE_SIZE) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setImageData({
          base64,
          filename: file.name,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleSubmit = async (values: FormValues) => {
    const apiValues: PhotoFormValues = {
      date: values.date,
      caption: values.caption || null,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>
            Update photo details. You can also replace the image.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Image Preview & Replace */}
            <div className="space-y-2">
              {imagePreview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imagePreview}
                  alt="Photo preview"
                  className="max-h-[240px] w-full rounded-lg object-cover"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Replace Image
              </Button>
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional caption for this photo..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
