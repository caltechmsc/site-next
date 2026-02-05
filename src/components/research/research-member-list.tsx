/**
 * Research Area Member List Component
 *
 * Displays members associated with a research area as avatar links.
 */

import Link from "next/link";
import { MemberPortrait } from "@/components/ui/member-portrait";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ResearchMemberListProps {
  members: Array<{
    member: {
      id: string;
      name: string;
      photo: string | null;
      position?: string | null;
    };
  }>;
  showPosition?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ResearchMemberList({
  members,
  showPosition = true,
  className,
}: ResearchMemberListProps) {
  if (members.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {members.map(({ member }) => (
        <Link
          key={member.id}
          href={`/members/${member.id}`}
          className="group flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 transition-colors hover:border-primary/50 hover:bg-accent/50"
        >
          {/* Avatar */}
          <MemberPortrait
            name={member.name}
            photo={member.photo}
            size="sm"
            variant="circle"
          />

          {/* Info */}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight group-hover:text-primary">
              {member.name}
            </p>
            {showPosition && member.position && (
              <p className="truncate text-xs text-muted-foreground">
                {member.position}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
