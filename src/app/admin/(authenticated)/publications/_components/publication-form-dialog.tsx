/**
 * Publication Form Dialog
 *
 * Modal dialog for creating and editing publications.
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TagInput } from "@/components/admin/shared";
import {
  lookupPublicationDoi,
  type PublicationFull,
} from "@/lib/admin/actions";
import { getCurrentDate } from "@/lib/date";
import type { PublicationInput } from "@/lib/admin/schemas";

// ============================================================================
// Types
// ============================================================================

// Form-specific schema with required fields for controlled inputs
const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  authors: z
    .array(z.string().trim().min(1))
    .min(1, "At least one author is required"),
  doi: z.string(),
  abstract: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  journal: z.string(),
  volume: z.string(),
  issue: z.string(),
  pages: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export interface PublicationFormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Publication to edit (null for create mode) */
  publication?: PublicationFull | null;
  /** Available journals for autocomplete */
  journals: string[];
  /** Available authors for autocomplete */
  authors: string[];
  /** Callback when form is submitted */
  onSubmit: (values: PublicationInput) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  /** Whether publication data is loading */
  isLoading?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function parseAuthorsFromJson(authors: string): string[] {
  try {
    const parsed = JSON.parse(authors);
    return Array.isArray(parsed) ? parsed : [authors];
  } catch {
    return authors ? [authors] : [];
  }
}

// ============================================================================
// Component
// ============================================================================

export function PublicationFormDialog({
  open,
  onOpenChange,
  publication,
  journals,
  authors: authorSuggestions,
  onSubmit,
  isSubmitting = false,
  isLoading = false,
}: PublicationFormDialogProps) {
  const isEditing = !!publication;
  const [isLookingUp, setIsLookingUp] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authors: [],
      doi: "",
      abstract: "",
      date: getCurrentDate(),
      journal: "",
      volume: "",
      issue: "",
      pages: "",
    },
  });

  // Reset form when dialog opens/closes or publication changes
  React.useEffect(() => {
    if (open && !isLoading) {
      form.reset({
        title: publication?.title ?? "",
        authors: publication ? parseAuthorsFromJson(publication.authors) : [],
        doi: publication?.doi ?? "",
        abstract: publication?.abstract ?? "",
        date: publication?.date ?? getCurrentDate(),
        journal: publication?.journal ?? "",
        volume: publication?.volume ?? "",
        issue: publication?.issue ?? "",
        pages: publication?.pages ?? "",
      });
    }
  }, [open, publication, form, isLoading]);

  // --------------------------------------------------------------------------
  // DOI Lookup
  // --------------------------------------------------------------------------

  const handleDoiLookup = React.useCallback(async () => {
    const doi = form.getValues("doi")?.trim();
    if (!doi) {
      toast.error("Please enter a DOI first");
      return;
    }

    setIsLookingUp(true);

    try {
      const result = await lookupPublicationDoi({ doi });

      if (result.success) {
        const data = result.data;

        form.setValue("title", data.title);
        if (data.authors.length > 0) {
          form.setValue("authors", data.authors);
        }
        if (data.abstract) {
          form.setValue("abstract", data.abstract);
        }
        if (data.date) {
          form.setValue("date", data.date);
        }
        if (data.journal) {
          form.setValue("journal", data.journal);
        }
        if (data.volume) {
          form.setValue("volume", data.volume);
        }
        if (data.issue) {
          form.setValue("issue", data.issue);
        }
        if (data.pages) {
          form.setValue("pages", data.pages);
        }

        toast.success(`Metadata loaded from ${data.source}`);
      } else {
        toast.error(result.error || "DOI lookup failed");
      }
    } catch {
      toast.error("DOI lookup failed");
    } finally {
      setIsLookingUp(false);
    }
  }, [form]);

  // --------------------------------------------------------------------------
  // Submit
  // --------------------------------------------------------------------------

  const handleSubmit = async (values: FormValues) => {
    const apiValues: PublicationInput = {
      title: values.title,
      authors: values.authors,
      doi: values.doi || null,
      abstract: values.abstract || null,
      date: values.date,
      journal: values.journal || null,
      volume: values.volume || null,
      issue: values.issue || null,
      pages: values.pages || null,
    };

    await onSubmit(apiValues);
  };

  // Prevent closing while submitting
  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting && !isLookingUp) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isEditing ? "Edit Publication" : "New Publication"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update publication metadata."
              : "Add a new publication. Use DOI lookup to auto-fill metadata."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading publication data...
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] px-6">
            <Form {...form}>
              <form
                id="publication-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 pb-4"
              >
                {/* DOI Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    DOI Lookup
                  </h3>

                  <FormField
                    control={form.control}
                    name="doi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DOI</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="10.1000/xyz123 or https://doi.org/..."
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            onClick={handleDoiLookup}
                            disabled={isLookingUp || !field.value?.trim()}
                          >
                            {isLookingUp ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="mr-1 h-4 w-4" />
                            )}
                            Lookup
                          </Button>
                        </div>
                        <FormDescription>
                          Enter a DOI and click Lookup to auto-fill metadata
                          from OpenAlex/Crossref. Older publications may not
                          have a DOI.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

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
                            placeholder="Publication title"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Authors TagInput */}
                  <FormField
                    control={form.control}
                    name="authors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authors *</FormLabel>
                        <FormControl>
                          <TagInput
                            value={field.value}
                            onChange={field.onChange}
                            suggestions={authorSuggestions}
                            placeholder="Add author name..."
                            addLabel="Add"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Add each author individually. Type to search existing
                          authors or add new ones.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    name="abstract"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abstract</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Publication abstract..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Journal Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Journal Details
                  </h3>

                  <FormField
                    control={form.control}
                    name="journal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Journal</FormLabel>
                        <FormControl>
                          <TagInput
                            value={field.value ? [field.value] : []}
                            onChange={(tags) =>
                              field.onChange(tags[tags.length - 1] || "")
                            }
                            suggestions={journals}
                            placeholder="Journal name..."
                            addLabel="Set"
                            disabled={isSubmitting}
                            maxSuggestions={10}
                          />
                        </FormControl>
                        <FormDescription>
                          Type to search existing journals or enter a new one.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="volume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 42"
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
                      name="issue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 3"
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
                      name="pages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pages</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 123-456"
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
              </form>
            </Form>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoading || isLookingUp}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="publication-form"
            disabled={isSubmitting || isLoading || isLookingUp}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Publication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
