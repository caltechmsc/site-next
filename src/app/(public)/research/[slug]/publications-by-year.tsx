"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { Publication, Member } from "@/types";
import { Button } from "@/components/ui/button";
import { PublicationCard } from "@/components/publication";

// ============================================================================
// Constants
// ============================================================================

const INITIAL_YEARS_SHOWN = 5;
const INITIAL_PUBS_PER_YEAR = 10;

// ============================================================================
// Types
// ============================================================================

interface PublicationWithMembers {
  publication: Publication & {
    members: { member: Pick<Member, "id" | "name"> }[];
  };
}

interface PublicationsByYearProps {
  publications: PublicationWithMembers[];
}

// ============================================================================
// Component
// ============================================================================

export function PublicationsByYear({ publications }: PublicationsByYearProps) {
  const [showAllYears, setShowAllYears] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Group by year
  const byYear = groupByYear(publications);
  const sortedYears = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  const visibleYears = showAllYears
    ? sortedYears
    : sortedYears.slice(0, INITIAL_YEARS_SHOWN);
  const hiddenYearsCount = sortedYears.length - INITIAL_YEARS_SHOWN;

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {visibleYears.map((year) => {
        const yearPubs = byYear[year];
        const isExpanded = expandedYears.has(year);
        const needsExpand = yearPubs.length > INITIAL_PUBS_PER_YEAR;
        const visiblePubs =
          isExpanded || !needsExpand
            ? yearPubs
            : yearPubs.slice(0, INITIAL_PUBS_PER_YEAR);
        const hiddenCount = yearPubs.length - INITIAL_PUBS_PER_YEAR;

        return (
          <div key={year}>
            {/* Year Header */}
            <div className="mb-3 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {year}
              </span>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">
                {yearPubs.length} paper{yearPubs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Publication List */}
            <div className="space-y-3">
              {visiblePubs.map(({ publication }) => (
                <PublicationCard
                  key={publication.doi}
                  publication={publication}
                />
              ))}
            </div>

            {/* Expand/Collapse Button */}
            {needsExpand && (
              <button
                onClick={() => toggleYear(year)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show fewer
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {hiddenCount} more
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}

      {/* Show All Years Button */}
      {hiddenYearsCount > 0 && !showAllYears && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAllYears(true)}
        >
          <ChevronDown className="mr-2 h-4 w-4" />
          Show {hiddenYearsCount} more year{hiddenYearsCount !== 1 ? "s" : ""}
        </Button>
      )}

      {showAllYears && hiddenYearsCount > 0 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setShowAllYears(false)}
        >
          <ChevronUp className="mr-2 h-4 w-4" />
          Show fewer years
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function groupByYear(
  publications: PublicationWithMembers[]
): Record<string, PublicationWithMembers[]> {
  return publications.reduce(
    (acc, item) => {
      const year = new Date(item.publication.date).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    },
    {} as Record<string, PublicationWithMembers[]>
  );
}
