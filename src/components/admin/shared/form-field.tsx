/**
 * Form Field Components
 *
 * Common form field wrapper that provides consistent styling.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// ============================================================================
// Types
// ============================================================================

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

interface FormFieldGroupProps {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

// ============================================================================
// Components
// ============================================================================

// ----------------------------------------------------------------------------
// Form Field
// ----------------------------------------------------------------------------

export function FormField({
  id,
  label,
  required,
  description,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Input element(s) */}
      {children}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Form Field Group
// ----------------------------------------------------------------------------

export function FormFieldGroup({
  title,
  description,
  className,
  children,
}: FormFieldGroupProps) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <legend className="text-sm font-medium leading-none">
              {title}
            </legend>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

// ----------------------------------------------------------------------------
// Form Actions
// ----------------------------------------------------------------------------

interface FormActionsProps {
  className?: string;
  children: React.ReactNode;
}

export function FormActions({ className, children }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Form Error Summary
// ----------------------------------------------------------------------------

interface FormErrorSummaryProps {
  errors: string[];
  className?: string;
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4",
        className
      )}
      role="alert"
      aria-labelledby="form-error-heading"
    >
      <h3
        id="form-error-heading"
        className="text-sm font-medium text-destructive"
      >
        Please fix the following errors:
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-destructive">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start gap-2">
            <span aria-hidden="true">•</span>
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
