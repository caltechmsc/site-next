/**
 * Collaborator List Component (Client-side)
 *
 * Interactive list with map and filters.
 * Handles selection state and filtering.
 */

"use client";

import { useState, useMemo } from "react";
import { Search, X, Globe } from "lucide-react";

import type { CollaboratorWithCoords } from "@/lib/db/queries/collaborators";
import { CollaboratorMap } from "./collaborator-map";
import { CollaboratorCard } from "./collaborator-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// Types
// ============================================================================

interface CollaboratorListProps {
  collaborators: CollaboratorWithCoords[];
  countries: string[];
}

// ============================================================================
// Component
// ============================================================================

export function CollaboratorList({
  collaborators,
  countries,
}: CollaboratorListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  // Filter collaborators
  const filteredCollaborators = useMemo(() => {
    return collaborators.filter((c) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          c.organization.toLowerCase().includes(searchLower) ||
          c.leader?.toLowerCase().includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower) ||
          c.country?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Country filter
      if (countryFilter && c.country !== countryFilter) {
        return false;
      }

      return true;
    });
  }, [collaborators, search, countryFilter]);

  // Collaborators with valid coordinates (for map)
  const collaboratorsWithCoords = useMemo(
    () => filteredCollaborators.filter((c) => c.hasCoords),
    [filteredCollaborators]
  );

  const hasFilters = search || countryFilter;

  const clearFilters = () => {
    setSearch("");
    setCountryFilter(null);
  };

  return (
    <div className="space-y-6">
      {/* Map Section */}
      {collaboratorsWithCoords.length > 0 && (
        <section className="overflow-hidden rounded-lg border">
          <CollaboratorMap
            collaborators={collaboratorsWithCoords}
            selectedId={selectedId}
            onSelect={setSelectedId}
            className="h-[300px] sm:h-[400px]"
          />
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search collaborators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Country Filter */}
          <Select
            value={countryFilter || "all"}
            onValueChange={(v: string) =>
              setCountryFilter(v === "all" ? null : v)
            }
          >
            <SelectTrigger className="w-[160px]">
              <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredCollaborators.length === collaborators.length ? (
          <span>
            Showing all {collaborators.length} collaborator
            {collaborators.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span>
            Showing {filteredCollaborators.length} of {collaborators.length}{" "}
            collaborator{collaborators.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Collaborator Grid */}
      {filteredCollaborators.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCollaborators.map((collaborator) => (
            <CollaboratorCard
              key={collaborator.id}
              collaborator={collaborator}
              isSelected={collaborator.id === selectedId}
              onClick={() =>
                setSelectedId(
                  collaborator.id === selectedId ? null : collaborator.id
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No collaborators match your filters.
          </p>
          {hasFilters && (
            <Button
              variant="link"
              onClick={clearFilters}
              className="mt-2 h-auto p-0"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
