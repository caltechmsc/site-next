"use client";

import { useState } from "react";
import type { CategoryWithMembers } from "@/lib/db/queries/members";
import { MemberGrid } from "@/components/member";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface MemberListClientProps {
  categories: CategoryWithMembers[];
}

// ============================================================================
// Component
// ============================================================================

export function MemberListClient({ categories }: MemberListClientProps) {
  // null = default view (show all default categories grouped)
  // string = specific category ID selected
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // Get default categories (showByDefault: true)
  const defaultCategories = categories.filter((cat) => cat.showByDefault);

  // Get selected category
  const selectedCategory = selectedCategoryId
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : null;

  return (
    <div className="space-y-6">
      {/* Category Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <CategoryTag
            key={category.id}
            name={category.name}
            count={category.members.length}
            isSelected={selectedCategoryId === category.id}
            onClick={() =>
              setSelectedCategoryId(
                selectedCategoryId === category.id ? null : category.id
              )
            }
          />
        ))}
      </div>

      {/* Content */}
      {selectedCategory ? (
        // Single category view
        <MemberGrid members={selectedCategory.members} />
      ) : (
        // Default view: grouped by default categories
        <div className="space-y-10">
          {defaultCategories.map((category) => (
            <CategorySection
              key={category.id}
              name={category.name}
              members={category.members}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface CategoryTagProps {
  name: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryTag({ name, count, isSelected, onClick }: CategoryTagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-accent"
      )}
    >
      {name}
      <span className="ml-1.5 text-xs opacity-70">{count}</span>
    </button>
  );
}

interface CategorySectionProps {
  name: string;
  members: CategoryWithMembers["members"];
}

function CategorySection({ name, members }: CategorySectionProps) {
  if (members.length === 0) return null;

  return (
    <section>
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold">{name}</h2>
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Member Grid */}
      <MemberGrid members={members} />
    </section>
  );
}
