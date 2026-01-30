/**
 * Research Area Member List Component
 *
 * Displays members associated with a research area as avatar links.
 */

import Link from "next/link";
import Image from "next/image";
import { getInitials } from "@/lib/format";
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
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
            {member.photo ? (
              <Image
                src={member.photo}
                alt={member.name}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {getInitials(member.name)}
              </span>
            )}
          </div>

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
