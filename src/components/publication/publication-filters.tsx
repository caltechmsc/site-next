/**
 * Publication Filters Component
 *
 * Client-side filter controls for the publication list.
 * Supports year, journal, research area, and text search.
 */

"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// Types
// ============================================================================

export interface FilterState {
  search: string;
  year: number | null;
  journal: string | null;
  areaId: string | null;
}

export interface FilterOptions {
  years: number[];
  journals: string[];
  researchAreas: { id: string; slug: string; title: string }[];
}

interface PublicationFiltersProps {
  options: FilterOptions;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// Component
// ============================================================================

export function PublicationFilters({
  options,
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  className,
}: PublicationFiltersProps) {
  // Local search input state (for debouncing)
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [isPending, startTransition] = useTransition();

  // Track if we're currently syncing to prevent loops
  const isSyncingRef = useRef(false);

  // Sync localSearch when filters.search changes externally (e.g., clear all)
  useEffect(() => {
    if (filters.search !== localSearch && !isSyncingRef.current) {
      setLocalSearch(filters.search);
    }
  }, [filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search: sync localSearch → filters.search
  useEffect(() => {
    // Skip if values already match
    if (localSearch === filters.search) return;

    const timer = setTimeout(() => {
      isSyncingRef.current = true;
      startTransition(() => {
        onFiltersChange({ ...filters, search: localSearch });
      });
      // Reset sync flag after state update
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update a single filter field
  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      // Special handling for search to sync localSearch
      if (key === "search") {
        setLocalSearch(value as string);
      }
      startTransition(() => {
        onFiltersChange({ ...filters, [key]: value });
      });
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setLocalSearch("");
    startTransition(() => {
      onFiltersChange({
        search: "",
        year: null,
        journal: null,
        areaId: null,
      });
    });
  }, [onFiltersChange]);

  // Clear search input
  const clearSearch = useCallback(() => {
    setLocalSearch("");
    startTransition(() => {
      onFiltersChange({ ...filters, search: "" });
    });
  }, [filters, onFiltersChange]);

  const hasActiveFilters =
    filters.search || filters.year || filters.journal || filters.areaId;

  const activeArea = options.researchAreas.find((a) => a.id === filters.areaId);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search publications..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Year Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.year ? "secondary" : "outline"}
              size="sm"
              className="h-8"
            >
              {filters.year || "Year"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-64 overflow-y-auto"
          >
            {filters.year && (
              <DropdownMenuItem onClick={() => updateFilter("year", null)}>
                <X className="mr-2 h-3 w-3" /> Clear
              </DropdownMenuItem>
            )}
            {options.years.map((year) => (
              <DropdownMenuItem
                key={year}
                onClick={() => updateFilter("year", year)}
              >
                {year}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Journal Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.journal ? "secondary" : "outline"}
              size="sm"
              className="h-8 max-w-40 truncate"
            >
              <span className="truncate">{filters.journal || "Journal"}</span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-64 max-w-72 overflow-y-auto"
          >
            {filters.journal && (
              <DropdownMenuItem onClick={() => updateFilter("journal", null)}>
                <X className="mr-2 h-3 w-3" /> Clear
              </DropdownMenuItem>
            )}
            {options.journals.map((journal) => (
              <DropdownMenuItem
                key={journal}
                onClick={() => updateFilter("journal", journal)}
                className="truncate"
              >
                {journal}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Research Area Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.areaId ? "secondary" : "outline"}
              size="sm"
              className="h-8 max-w-48 truncate"
            >
              <span className="truncate">
                {activeArea?.title || "Research Area"}
              </span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-64 max-w-72 overflow-y-auto"
          >
            {filters.areaId && (
              <DropdownMenuItem onClick={() => updateFilter("areaId", null)}>
                <X className="mr-2 h-3 w-3" /> Clear
              </DropdownMenuItem>
            )}
            {options.researchAreas.map((area) => (
              <DropdownMenuItem
                key={area.id}
                onClick={() => updateFilter("areaId", area.id)}
                className="truncate"
              >
                {area.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}

        {/* Results Count */}
        <span className="ml-auto text-sm text-muted-foreground">
          {isPending ? (
            <span className="animate-pulse">Filtering...</span>
          ) : filteredCount === totalCount ? (
            <span>{totalCount} publications</span>
          ) : (
            <span>
              {filteredCount} of {totalCount}
            </span>
          )}
        </span>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {filters.search && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              Search: &ldquo;{filters.search}&rdquo;
              <button onClick={clearSearch} aria-label="Clear search">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.year && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              Year: {filters.year}
              <button onClick={() => updateFilter("year", null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.journal && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              Journal: {filters.journal}
              <button onClick={() => updateFilter("journal", null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeArea && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              Area: {activeArea.title}
              <button onClick={() => updateFilter("areaId", null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
