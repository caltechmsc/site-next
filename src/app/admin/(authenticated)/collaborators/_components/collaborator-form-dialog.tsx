/**
 * Collaborator Form Dialog
 *
 * Modal dialog for creating and editing collaborators.
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { LocationPicker } from "./location-picker";
import type { CollaboratorInput } from "@/lib/admin/schemas";
import type { CollaboratorListItem } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

// Form-specific schema with required fields for controlled inputs
const formSchema = z
  .object({
    organization: z.string().trim().min(1, "Organization is required"),
    leader: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")).optional(),
    website: z.string().url("Invalid URL").or(z.literal("")).optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    isHidden: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== undefined && data.latitude.trim() !== "";
    const hasLng = data.longitude !== undefined && data.longitude.trim() !== "";

    if (hasLat && !hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Longitude is required when latitude is provided",
        path: ["longitude"],
      });
    } else if (!hasLat && hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude is required when longitude is provided",
        path: ["latitude"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface CollaboratorFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Collaborator to edit (null for create mode) */
  collaborator?: CollaboratorListItem | null;
  /** Callback when form is submitted */
  onSubmit: (values: CollaboratorInput) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CollaboratorFormDialog({
  open,
  onOpenChange,
  collaborator,
  onSubmit,
  isSubmitting = false,
}: CollaboratorFormDialogProps) {
  const isEditing = !!collaborator;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: "",
      leader: "",
      email: "",
      website: "",
      country: "",
      city: "",
      latitude: "",
      longitude: "",
      isHidden: false,
    },
  });

  // Reset form when dialog opens/closes or collaborator changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        organization: collaborator?.organization ?? "",
        leader: collaborator?.leader ?? "",
        email: collaborator?.email ?? "",
        website: collaborator?.website ?? "",
        country: collaborator?.country ?? "",
        city: collaborator?.city ?? "",
        latitude:
          collaborator?.latitude !== null &&
          collaborator?.latitude !== undefined
            ? String(collaborator.latitude)
            : "",
        longitude:
          collaborator?.longitude !== null &&
          collaborator?.longitude !== undefined
            ? String(collaborator.longitude)
            : "",
        isHidden: collaborator?.isHidden ?? false,
      });
    }
  }, [open, collaborator, form]);

  // Handle map location selection
  const handleLocationChange = React.useCallback(
    (coords: { latitude: number; longitude: number } | null) => {
      if (coords) {
        form.setValue("latitude", String(coords.latitude));
        form.setValue("longitude", String(coords.longitude));
        // Clear any validation errors
        form.clearErrors("latitude");
        form.clearErrors("longitude");
      } else {
        form.setValue("latitude", "");
        form.setValue("longitude", "");
      }
    },
    [form]
  );

  const handleSubmit = async (values: FormValues) => {
    // Parse coordinates
    const latitude =
      values.latitude && values.latitude.trim() !== ""
        ? parseFloat(values.latitude)
        : null;
    const longitude =
      values.longitude && values.longitude.trim() !== ""
        ? parseFloat(values.longitude)
        : null;

    // Validate coordinate ranges
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      form.setError("latitude", {
        type: "manual",
        message: "Latitude must be between -90 and 90",
      });
      return;
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      form.setError("longitude", {
        type: "manual",
        message: "Longitude must be between -180 and 180",
      });
      return;
    }

    // Transform form values to API format
    const apiValues: CollaboratorInput = {
      organization: values.organization,
      leader: values.leader || null,
      email: values.email || null,
      website: values.website || null,
      country: values.country || null,
      city: values.city || null,
      latitude,
      longitude,
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
            {isEditing ? "Edit Collaborator" : "New Collaborator"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update collaborator information and location."
              : "Add a new research collaborator or partner."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <Form {...form}>
            <form
              id="collaborator-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 pb-4"
            >
              {/* Organization Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Organization Information
                </h3>

                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Stanford University"
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
                  name="leader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leader / Contact</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Prof. John Smith"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
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

              {/* Location Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Location
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Stanford"
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
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., USA"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., 37.4275"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>-90 to 90</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., -122.1697"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>-180 to 180</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Map Picker */}
                <LocationPicker
                  latitude={
                    form.watch("latitude")
                      ? parseFloat(form.watch("latitude")!)
                      : null
                  }
                  longitude={
                    form.watch("longitude")
                      ? parseFloat(form.watch("longitude")!)
                      : null
                  }
                  onChange={handleLocationChange}
                  disabled={isSubmitting}
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
                        Hidden collaborators won&apos;t appear on the public
                        collaborators page
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="collaborator-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Collaborator"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
