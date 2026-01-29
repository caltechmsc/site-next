/**
 * Member Grid Component
 *
 * Responsive grid layout for displaying member cards.
 * Supports category filtering via tabs.
 */

import type { MemberWithCategory } from "@/types";
import { MemberCard } from "./member-card";

// ============================================================================
// Types
// ============================================================================

interface MemberGridProps {
  members: MemberWithCategory[];
}

// ============================================================================
// Component
// ============================================================================

export function MemberGrid({ members }: MemberGridProps) {
  if (members.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No members found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
