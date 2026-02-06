/**
 * Publication Timeline Component
 *
 * Visual representation of publication activity over years.
 * Displays a bar chart showing publication counts per year.
 */

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

/** Default number of years to show before collapsing */
const DEFAULT_VISIBLE_YEARS = 20;

/** Height of the chart area in pixels */
const CHART_HEIGHT = 64;

/** Minimum bar height (in pixels) for years with publications */
const MIN_BAR_HEIGHT = 4;

// ============================================================================
// Types
// ============================================================================

interface PublicationTimelineProps {
  yearlyDistribution: Record<number, number>;
  yearRange: { min: number; max: number };
}

// ============================================================================
// Component
// ============================================================================

export function PublicationTimeline({
  yearlyDistribution,
  yearRange,
}: PublicationTimelineProps) {
  const { min, max } = yearRange;
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate all years in range
  const allYears: number[] = [];
  for (let year = min; year <= max; year++) {
    allYears.push(year);
  }

  // Find max count for normalization
  const maxCount = Math.max(...Object.values(yearlyDistribution), 1);

  // Only show if we have meaningful data
  if (allYears.length === 0 || maxCount === 0) {
    return null;
  }

  // Determine which years to show
  const needsCollapse = allYears.length > DEFAULT_VISIBLE_YEARS;
  const visibleYears =
    needsCollapse && !isExpanded
      ? allYears.slice(-DEFAULT_VISIBLE_YEARS) // Show most recent years
      : allYears;

  const hiddenYearsCount = allYears.length - visibleYears.length;
  const visibleMin = visibleYears[0];
  const visibleMax = visibleYears[visibleYears.length - 1];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Publication Timeline
        </span>
        {needsCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronRight className="h-3 w-3" />
                Show recent {DEFAULT_VISIBLE_YEARS} years
              </>
            ) : (
              <>
                <ChevronLeft className="h-3 w-3" />
                Show all {allYears.length} years
              </>
            )}
          </button>
        )}
      </div>

      {/* Timeline Bars */}
      <div className="flex items-end gap-0.5" style={{ height: CHART_HEIGHT }}>
        {/* Collapsed Indicator */}
        {needsCollapse && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="group flex h-full shrink-0 items-end px-1"
            title={`Show ${hiddenYearsCount} earlier years`}
          >
            <div className="flex flex-col items-center gap-0.5 pb-1">
              <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                +{hiddenYearsCount}
              </span>
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-1 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-primary/60"
                  />
                ))}
              </div>
            </div>
          </button>
        )}

        {visibleYears.map((year) => {
          const count = yearlyDistribution[year] || 0;
          const barHeight =
            count > 0
              ? Math.max(
                  Math.round((count / maxCount) * CHART_HEIGHT),
                  MIN_BAR_HEIGHT
                )
              : 2;

          return (
            <div
              key={year}
              className="group relative flex flex-1 items-end justify-center"
              style={{ height: CHART_HEIGHT }}
            >
              {/* Bar */}
              <div
                className={cn(
                  "w-full min-w-[3px] rounded-t transition-colors",
                  count > 0
                    ? "bg-primary hover:bg-primary/80"
                    : "bg-muted-foreground/20 hover:bg-muted-foreground/30"
                )}
                style={{ height: barHeight }}
              />

              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="whitespace-nowrap rounded bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border">
                  {year}: {count} paper{count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Year Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{visibleMin}</span>
        {visibleMax !== visibleMin && <span>{visibleMax}</span>}
      </div>
    </div>
  );
}
