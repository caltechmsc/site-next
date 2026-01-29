"use client";

import { useState } from "react";
import type { MemberWithCategory } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MemberGrid } from "@/components/member";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface Category {
  id: string;
  name: string;
  count: number;
}

interface MemberListClientProps {
  categories: Category[];
  allMembers: MemberWithCategory[];
  membersByCategory: Record<string, MemberWithCategory[]>;
}

// ============================================================================
// Component
// ============================================================================

export function MemberListClient({
  categories,
  allMembers,
  membersByCategory,
}: MemberListClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* Category Tabs */}
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger
          value="all"
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            "data-[state=inactive]:border-border data-[state=inactive]:bg-transparent",
            "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent",
            "data-[state=active]:border-primary data-[state=active]:bg-primary",
            "data-[state=active]:text-primary-foreground"
          )}
        >
          All
          <span className="ml-1.5 text-xs opacity-70">{allMembers.length}</span>
        </TabsTrigger>

        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              "data-[state=inactive]:border-border data-[state=inactive]:bg-transparent",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent",
              "data-[state=active]:border-primary data-[state=active]:bg-primary",
              "data-[state=active]:text-primary-foreground"
            )}
          >
            {category.name}
            <span className="ml-1.5 text-xs opacity-70">{category.count}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Content: All Members */}
      <TabsContent value="all" className="mt-6">
        <MemberGrid members={allMembers} />
      </TabsContent>

      {/* Content: By Category */}
      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id} className="mt-6">
          <MemberGrid members={membersByCategory[category.id] || []} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
