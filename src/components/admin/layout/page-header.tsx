"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description */
  description?: string;
  /** Back navigation URL */
  backHref?: string;
  /** Back button label */
  backLabel?: string;
  /** Action buttons or other content */
  actions?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Go back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Back Navigation */}
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        </Button>
      )}

      {/* Header Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Actions Slot */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
