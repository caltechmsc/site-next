/**
 * Confirm Dialog Component
 *
 * Reusable confirmation dialog for destructive actions.
 * Uses AlertDialog from Radix UI for accessible modal behavior.
 */

"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void | Promise<void>;
  /** Disable interactions during async operations */
  loading?: boolean;
}

// ============================================================================
// Variant Config
// ============================================================================

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: React.ElementType;
    iconClassName: string;
    confirmButtonVariant: "destructive" | "default";
  }
> = {
  danger: {
    icon: AlertTriangle,
    iconClassName: "text-destructive",
    confirmButtonVariant: "destructive",
  },
  warning: {
    icon: AlertCircle,
    iconClassName: "text-yellow-600 dark:text-yellow-500",
    confirmButtonVariant: "default",
  },
  info: {
    icon: Info,
    iconClassName: "text-primary",
    confirmButtonVariant: "default",
  },
};

// ============================================================================
// Base Components (from Radix)
// ============================================================================

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

// ============================================================================
// Main Component
// ============================================================================

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {/* Header with Icon */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              variant === "danger" && "bg-destructive/10",
              variant === "warning" && "bg-yellow-100 dark:bg-yellow-900/20",
              variant === "info" && "bg-primary/10"
            )}
          >
            <Icon className={cn("h-5 w-5", config.iconClassName)} />
          </div>
          <div className="flex-1">
            <AlertDialogPrimitive.Title className="text-lg font-semibold">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogPrimitive.Cancel
            className={cn(buttonVariants({ variant: "outline" }))}
            disabled={loading}
          >
            {cancelText}
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action
            className={cn(
              buttonVariants({ variant: config.confirmButtonVariant })
            )}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogContent>
    </AlertDialogPrimitive.Root>
  );
}
