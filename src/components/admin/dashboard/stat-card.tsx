"use client";

import * as React from "react";
import Link from "next/link";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// Types
// ============================================================================

export type StatCardVariant = "default" | "success" | "warning" | "info";

export interface StatCardProps {
  /** Stat label */
  title: string;
  /** Main value to display */
  value: number | string;
  /** Optional description or sublabel */
  description?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Visual variant for categorization */
  variant?: StatCardVariant;
  /** Trend indicator (positive = up, negative = down, 0 = neutral) */
  trend?: number;
  /** Link to navigate to when clicked */
  href?: string;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Variant Styles
// ============================================================================

const variantStyles: Record<StatCardVariant, string> = {
  default: "border-border",
  success: "border-green-500/50 bg-green-500/5",
  warning: "border-yellow-500/50 bg-yellow-500/5",
  info: "border-blue-500/50 bg-blue-500/5",
};

const iconVariantStyles: Record<StatCardVariant, string> = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-500",
  warning: "text-yellow-600 dark:text-yellow-500",
  info: "text-blue-600 dark:text-blue-500",
};

// ============================================================================
// Trend Indicator
// ============================================================================

function TrendIndicator({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
        <TrendingUp className="h-3 w-3" />
        <span>+{trend}%</span>
      </span>
    );
  }

  if (trend < 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-500">
        <TrendingDown className="h-3 w-3" />
        <span>{trend}%</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span>0%</span>
    </span>
  );
}

// ============================================================================
// Component
// ============================================================================

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
  href,
  className,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-colors",
        variantStyles[variant],
        href && "cursor-pointer hover:border-primary/50",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", iconVariantStyles[variant])} />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && <TrendIndicator trend={trend} />}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
