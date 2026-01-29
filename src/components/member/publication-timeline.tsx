/**
 * Publication Timeline Component
 *
 * Visual representation of publication activity over years.
 */

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

  // Generate all years in range
  const years: number[] = [];
  for (let year = min; year <= max; year++) {
    years.push(year);
  }

  // Find max count for normalization
  const maxCount = Math.max(...Object.values(yearlyDistribution), 1);

  // Only show if we have meaningful data
  if (years.length === 0 || maxCount === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        Publication Timeline
      </div>

      {/* Timeline Bars */}
      <div className="flex h-16 items-end gap-1">
        {years.map((year) => {
          const count = yearlyDistribution[year] || 0;
          const heightPercent = (count / maxCount) * 100;

          return (
            <div
              key={year}
              className="group relative flex flex-1 flex-col items-center"
            >
              {/* Bar */}
              <div
                className="w-full rounded-t bg-primary/20 transition-colors group-hover:bg-primary/40"
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              >
                {count > 0 && (
                  <div
                    className="w-full rounded-t bg-primary transition-all"
                    style={{ height: "100%" }}
                  />
                )}
              </div>

              {/* Tooltip */}
              {count > 0 && (
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-xs font-medium text-background">
                    {count}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Year Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        {max !== min && <span>{max}</span>}
      </div>
    </div>
  );
}
