/**
 * Publications By Year Component
 *
 * Displays publications grouped by year with collapsible sections.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { Publication, Member, ResearchArea } from "@/types";
import { Button } from "@/components/ui/button";
import { PublicationCard } from "./publication-card";
import { getYear } from "@/lib/date";

// ============================================================================
// Constants
// ============================================================================

/** Number of years shown initially before "Show more years" button */
const DEFAULT_INITIAL_YEARS = 5;

/** Number of additional years to load each time */
const DEFAULT_YEARS_INCREMENT = 3;

/** Number of publications shown per year initially */
const DEFAULT_INITIAL_PUBS_PER_YEAR = 10;

/** Number of additional publications to load per year each time */
const DEFAULT_PUBS_INCREMENT = 10;

// ============================================================================
// Types
// ============================================================================

type PublicationItem = Publication & {
  members?: { member: Pick<Member, "id" | "name"> }[];
  researchAreas?: {
    researchArea: Pick<ResearchArea, "id" | "slug" | "title">;
  }[];
};

type WrappedPublication = {
  publication: PublicationItem;
};

type PublicationInput = PublicationItem | WrappedPublication;

interface PublicationsByYearProps {
  /** Array of publications to display (direct or wrapped format) */
  publications: PublicationInput[];
  /** Whether to show research area badges on cards */
  showAreas?: boolean;
  /** Custom initial years shown (default: 5) */
  initialYearsShown?: number;
  /** Custom initial pubs per year (default: 10) */
  initialPubsPerYear?: number;
  /** Custom years increment when loading more (default: 3) */
  yearsIncrement?: number;
  /** Custom pubs increment when loading more (default: 10) */
  pubsIncrement?: number;
}

// ============================================================================
// Component
// ============================================================================

export function PublicationsByYear({
  publications: rawPublications,
  showAreas = false,
  initialYearsShown = DEFAULT_INITIAL_YEARS,
  initialPubsPerYear = DEFAULT_INITIAL_PUBS_PER_YEAR,
  yearsIncrement = DEFAULT_YEARS_INCREMENT,
  pubsIncrement = DEFAULT_PUBS_INCREMENT,
}: PublicationsByYearProps) {
  // Track how many years to show (progressive loading)
  const [visibleYearsCount, setVisibleYearsCount] = useState(initialYearsShown);

  // Track visible publications count per year (progressive loading)
  const [yearVisibleCounts, setYearVisibleCounts] = useState<
    Record<string, number>
  >({});

  // Normalize input to consistent format
  const publications = useMemo(
    () => normalizePublications(rawPublications),
    [rawPublications]
  );

  // Group by year and sort
  const byYear = useMemo(() => groupByYear(publications), [publications]);
  const sortedYears = useMemo(
    () => Object.keys(byYear).sort((a, b) => Number(b) - Number(a)),
    [byYear]
  );

  // Calculate visible years
  const visibleYears = sortedYears.slice(0, visibleYearsCount);
  const hasMoreYears = visibleYearsCount < sortedYears.length;
  const remainingYearsCount = sortedYears.length - visibleYearsCount;

  // Get visible count for a specific year
  const getVisibleCount = useCallback(
    (year: string) => yearVisibleCounts[year] ?? initialPubsPerYear,
    [yearVisibleCounts, initialPubsPerYear]
  );

  // Load more years (progressive)
  const handleLoadMoreYears = useCallback(() => {
    setVisibleYearsCount((prev) =>
      Math.min(prev + yearsIncrement, sortedYears.length)
    );
  }, [yearsIncrement, sortedYears.length]);

  // Collapse years back to initial
  const handleCollapseYears = useCallback(() => {
    setVisibleYearsCount(initialYearsShown);
  }, [initialYearsShown]);

  // Load more publications for a specific year
  const handleLoadMorePubs = useCallback(
    (year: string) => {
      const totalPubs = byYear[year]?.length ?? 0;
      setYearVisibleCounts((prev) => ({
        ...prev,
        [year]: Math.min(
          (prev[year] ?? initialPubsPerYear) + pubsIncrement,
          totalPubs
        ),
      }));
    },
    [byYear, initialPubsPerYear, pubsIncrement]
  );

  // Collapse publications for a specific year
  const handleCollapsePubs = useCallback((year: string) => {
    setYearVisibleCounts((prev) => {
      const next = { ...prev };
      delete next[year];
      return next;
    });
  }, []);

  // Empty state
  if (publications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No publications found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {visibleYears.map((year) => {
        const yearPubs = byYear[year];
        const visibleCount = getVisibleCount(year);
        const visiblePubs = yearPubs.slice(0, visibleCount);
        const hasMorePubs = visibleCount < yearPubs.length;
        const remainingPubsCount = yearPubs.length - visibleCount;
        const isExpanded = visibleCount > initialPubsPerYear;

        return (
          <section key={year} aria-labelledby={`year-${year}`}>
            {/* Year Header */}
            <header className="mb-3 flex items-center gap-3">
              <h3
                id={`year-${year}`}
                className="text-sm font-medium text-muted-foreground"
              >
                {year}
              </h3>
              <div className="h-px flex-1 bg-border" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">
                {yearPubs.length} paper{yearPubs.length !== 1 ? "s" : ""}
              </span>
            </header>

            {/* Publication List */}
            <div className="space-y-3">
              {visiblePubs.map((publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                  showAreas={showAreas}
                />
              ))}
            </div>

            {/* Year Expand/Collapse Controls */}
            {yearPubs.length > initialPubsPerYear && (
              <div className="mt-3">
                {hasMorePubs ? (
                  <button
                    onClick={() => handleLoadMorePubs(year)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Show {Math.min(remainingPubsCount, pubsIncrement)} more
                    {remainingPubsCount > pubsIncrement && (
                      <span className="ml-1 text-xs">
                        ({remainingPubsCount} remaining)
                      </span>
                    )}
                  </button>
                ) : isExpanded ? (
                  <button
                    onClick={() => handleCollapsePubs(year)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <ChevronUp className="h-4 w-4" />
                    Show fewer
                  </button>
                ) : null}
              </div>
            )}
          </section>
        );
      })}

      {/* Years Navigation Controls */}
      {sortedYears.length > initialYearsShown && (
        <div className="flex flex-col gap-2">
          {hasMoreYears && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMoreYears}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Show {Math.min(remainingYearsCount, yearsIncrement)} more year
              {Math.min(remainingYearsCount, yearsIncrement) !== 1 ? "s" : ""}
              {remainingYearsCount > yearsIncrement && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({remainingYearsCount} remaining)
                </span>
              )}
            </Button>
          )}

          {visibleYearsCount > initialYearsShown && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleCollapseYears}
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Show fewer years
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function isWrappedPublication(
  item: PublicationInput
): item is WrappedPublication {
  return "publication" in item && typeof item.publication === "object";
}

function normalizePublications(items: PublicationInput[]): PublicationItem[] {
  return items.map((item) =>
    isWrappedPublication(item) ? item.publication : item
  );
}

function groupByYear(
  publications: PublicationItem[]
): Record<string, PublicationItem[]> {
  return publications.reduce(
    (acc, pub) => {
      const year = getYear(pub.date).toString();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(pub);
      return acc;
    },
    {} as Record<string, PublicationItem[]>
  );
}
