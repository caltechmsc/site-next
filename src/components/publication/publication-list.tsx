/**
 * Publication List Component
 *
 * Virtualized list of publications with client-side filtering.
 * Optimized for large datasets using windowing.
 */

"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { PublicationListItem } from "@/types";
import { cn } from "@/lib/utils";
import { getYear } from "@/lib/date";
import { PublicationCard } from "./publication-card";
import {
  PublicationFilters,
  FilterState,
  FilterOptions,
} from "./publication-filters";

// ============================================================================
// Types
// ============================================================================

interface PublicationListProps {
  publications: PublicationListItem[];
  filterOptions: FilterOptions;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PublicationList({
  publications,
  filterOptions,
  className,
}: PublicationListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    year: null,
    journal: null,
    areaId: null,
  });

  // Filter publications
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      // Search filter
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

  // Extract search terms for highlighting
  const highlightTerms = useMemo(() => {
    if (!filters.search) return undefined;
    return filters.search.split(/\s+/).filter((term) => term.length >= 2);
  }, [filters.search]);

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: filteredPublications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Estimated card height
    overscan: 5,
  });

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    // Scroll to top when filters change
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, []);

  // Show regular list for small datasets, virtual list for large
  const useVirtualization = publications.length > 50;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Filters */}
      <PublicationFilters
        options={filterOptions}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={publications.length}
        filteredCount={filteredPublications.length}
        className="mb-6"
      />

      {/* Publication List */}
      {filteredPublications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No publications found matching your criteria.
          </p>
          {(filters.search ||
            filters.year ||
            filters.journal ||
            filters.areaId) && (
            <button
              onClick={() =>
                handleFiltersChange({
                  search: "",
                  year: null,
                  journal: null,
                  areaId: null,
                })
              }
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : useVirtualization ? (
        // Virtualized list for large datasets
        <div
          ref={parentRef}
          className="flex-1 overflow-auto"
          style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const publication = filteredPublications[virtualItem.index];
              return (
                <div
                  key={publication.doi}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <PublicationCard
                    publication={publication}
                    showAreas
                    highlightTerms={highlightTerms}
                    className="mb-3"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Regular list for small datasets
        <div className="space-y-3">
          {filteredPublications.map((publication) => (
            <PublicationCard
              key={publication.doi}
              publication={publication}
              showAreas
              highlightTerms={highlightTerms}
            />
          ))}
        </div>
      )}
    </div>
  );
}
