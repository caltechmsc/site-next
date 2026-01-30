/**
 * Research Area Hierarchy Component
 *
 * Displays research areas in a nested card layout.
 * Parent cards have their children indented below them.
 */

import type { ResearchAreaWithHierarchy } from "@/types";
import { ResearchCard } from "./research-card";

// ============================================================================
// Types
// ============================================================================

interface ResearchHierarchyProps {
  areas: ResearchAreaWithHierarchy[];
}

// ============================================================================
// Component
// ============================================================================

export function ResearchHierarchy({ areas }: ResearchHierarchyProps) {
  return (
    <div className="space-y-6">
      {areas.map((area) => (
        <ResearchAreaNode key={area.id} area={area} />
      ))}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ResearchAreaNodeProps {
  area: ResearchAreaWithHierarchy;
}

function ResearchAreaNode({ area }: ResearchAreaNodeProps) {
  const hasChildren = area.children.length > 0;

  return (
    <div className="space-y-2">
      {/* Parent Card */}
      <ResearchCard
        slug={area.slug}
        title={area.title}
        stats={area.stats}
        members={area.members}
        isChild={false}
      />

      {/* Children Cards */}
      {hasChildren && (
        <div className="relative ml-4 space-y-2 sm:ml-6">
          {/* Connecting Line */}
          <div className="absolute -left-3 top-0 h-full w-px bg-border sm:-left-4" />

          {area.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal connector */}
              <div className="absolute -left-3 top-1/2 h-px w-3 bg-border sm:-left-4 sm:w-4" />

              {/* Dot at junction */}
              {index === area.children.length - 1 && (
                <div className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-x-0.5 -translate-y-1/2 rounded-full bg-border sm:-left-4" />
              )}

              <ResearchCard
                slug={child.slug}
                title={child.title}
                stats={child.stats}
                members={child.members}
                isChild={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
