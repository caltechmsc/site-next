/**
 * Tag Input Component
 *
 * GitHub-style tag input with autocomplete suggestions from existing values.
 */

"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================================================================
// Types
// ============================================================================

export interface TagInputProps {
  /** Current tags */
  value: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Existing suggestions for autocomplete */
  suggestions?: string[];
  /** Placeholder text when no tags */
  placeholder?: string;
  /** Label for the add button */
  addLabel?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Maximum number of suggestions to show */
  maxSuggestions?: number;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_SUGGESTIONS = 15;

// ============================================================================
// Component
// ============================================================================

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add item...",
  addLabel = "Add",
  disabled = false,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  className,
}: TagInputProps) {
  const [search, setSearch] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter suggestions: exclude already-selected tags, match search
  const filteredSuggestions = React.useMemo(() => {
    const selectedSet = new Set(value.map((v) => v.toLowerCase()));
    const query = search.toLowerCase().trim();

    return suggestions
      .filter((s) => {
        const lower = s.toLowerCase();
        if (selectedSet.has(lower)) return false;
        if (query && !lower.includes(query)) return false;
        return true;
      })
      .slice(0, maxSuggestions);
  }, [suggestions, value, search, maxSuggestions]);

  // Check if the current search text is already a tag
  const searchMatchesExisting = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return false;
    return value.some((v) => v.toLowerCase() === query);
  }, [search, value]);

  // Whether to show "Create new" option
  const showCreateOption = React.useMemo(() => {
    const query = search.trim();
    if (!query) return false;
    if (searchMatchesExisting) return false;
    const exactMatch = suggestions.some(
      (s) => s.toLowerCase() === query.toLowerCase()
    );
    return !exactMatch;
  }, [search, searchMatchesExisting, suggestions]);

  // Combined dropdown items
  const dropdownItems = React.useMemo(() => {
    const items: { label: string; value: string; isNew: boolean }[] = [];
    for (const s of filteredSuggestions) {
      items.push({ label: s, value: s, isNew: false });
    }
    if (showCreateOption) {
      items.push({
        label: `Create "${search.trim()}"`,
        value: search.trim(),
        isNew: true,
      });
    }
    return items;
  }, [filteredSuggestions, showCreateOption, search]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = React.useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
      onChange([...value, trimmed]);
      setSearch("");
      setShowDropdown(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const removeTag = React.useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setShowDropdown(true);
        setHighlightedIndex((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : dropdownItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < dropdownItems.length) {
          addTag(dropdownItems[highlightedIndex].value);
        } else {
          const trimmed = search.trim();
          if (trimmed) addTag(trimmed);
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      } else if (e.key === "Backspace" && !search && value.length > 0) {
        removeTag(value.length - 1);
      }
    },
    [search, addTag, removeTag, value.length, dropdownItems, highlightedIndex]
  );

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {/* Tag List */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className="gap-1 pl-2 pr-1"
            >
              <span className="max-w-[200px] truncate text-xs">{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Add Tag Input with Dropdown */}
      {!disabled && (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (search || suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder={placeholder}
              className="h-8 text-sm"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={() => {
                const trimmed = search.trim();
                if (trimmed) addTag(trimmed);
              }}
              disabled={!search.trim() || searchMatchesExisting}
            >
              <Plus className="mr-1 h-3 w-3" />
              {addLabel}
            </Button>
          </div>

          {/* Dropdown Suggestions */}
          {showDropdown && dropdownItems.length > 0 && (
            <div
              className={cn(
                "absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md",
                "max-h-[200px] overflow-y-auto"
              )}
            >
              {dropdownItems.map((item, index) => (
                <button
                  key={item.isNew ? "__create__" : item.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                    "transition-colors hover:bg-accent hover:text-accent-foreground",
                    index === highlightedIndex &&
                      "bg-accent text-accent-foreground",
                    item.isNew && "font-medium"
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(item.value);
                  }}
                >
                  {item.isNew && (
                    <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
