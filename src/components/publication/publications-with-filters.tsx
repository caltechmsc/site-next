/**
 * Publications With Filters Component
 *
 * Combines PublicationFilters with PublicationsByYear for a complete
 * publication browsing experience with filtering support.
 */

"use client";

import { useState, useMemo, useCallback } from "react";

import type { PublicationListItem } from "@/types";
import { getYear } from "@/lib/date";
import { PublicationFilters } from "./publication-filters";
import { PublicationsByYear } from "./publications-by-year";
import type { FilterState, FilterOptions } from "./publication-filters";

// ============================================================================
// Types
// ============================================================================

interface PublicationsWithFiltersProps {
  /** Array of publications to display */
  publications: PublicationListItem[];
  /** Filter options (years, journals, research areas) */
  filterOptions: FilterOptions;
  /** Whether to show research area badges on cards */
  showAreas?: boolean;
  /** Custom initial years shown (default: 5) */
  initialYearsShown?: number;
  /** Custom initial pubs per year (default: 10) */
  initialPubsPerYear?: number;
}

// ============================================================================
// Component
// ============================================================================

export function PublicationsWithFilters({
  publications,
  filterOptions,
  showAreas = true,
  initialYearsShown,
  initialPubsPerYear,
}: PublicationsWithFiltersProps) {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    year: null,
    journal: null,
    areaId: null,
  });

  // Filter publications based on active filters
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      // Search filter (title, authors, abstract)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchTitle = pub.title.toLowerCase().includes(searchLower);
        const matchAuthors = pub.authors.toLowerCase().includes(searchLower);
        const matchAbstract = pub.abstract?.toLowerCase().includes(searchLower);
        if (!matchTitle && !matchAuthors && !matchAbstract) {
          return false;
        }
      }

      // Year filter
      if (filters.year) {
        const pubYear = getYear(pub.date);
        if (pubYear !== filters.year) {
          return false;
        }
      }

      // Journal filter
      if (filters.journal && pub.journal !== filters.journal) {
        return false;
      }

      // Research area filter
      if (filters.areaId) {
        const hasArea = pub.researchAreas.some(
          ({ researchArea }) => researchArea.id === filters.areaId
        );
        if (!hasArea) {
          return false;
        }
      }

      return true;
    });
  }, [publications, filters]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      year: null,
      journal: null,
      areaId: null,
    });
  }, []);

  const hasActiveFilters =
    filters.search || filters.year || filters.journal || filters.areaId;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <PublicationFilters
        options={filterOptions}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={publications.length}
        filteredCount={filteredPublications.length}
      />

      {/* Publications Grouped by Year */}
      {filteredPublications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No publications found matching your criteria.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <PublicationsByYear
          publications={filteredPublications}
          showAreas={showAreas}
          initialYearsShown={initialYearsShown}
          initialPubsPerYear={initialPubsPerYear}
        />
      )}
    </div>
  );
}
