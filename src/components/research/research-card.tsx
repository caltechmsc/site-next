/**
 * Research Area Card Component
 *
 * Displays a research area in a card format with stats.
 * Used in the research areas list page.
 */

import Link from "next/link";
import Image from "next/image";
import { FileText, Users, Quote } from "lucide-react";

import type { ResearchAreaStats } from "@/types";
import { cn } from "@/lib/utils";
import { formatCompactNumber, getInitials } from "@/lib/format";

// ============================================================================
// Types
// ============================================================================

interface ResearchCardProps {
  slug: string;
  title: string;
  stats: ResearchAreaStats;
  members: Array<{
    member: { id: string; name: string; photo: string | null };
  }>;
  isChild?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_AVATARS = 4;

// ============================================================================
// Component
// ============================================================================

export function ResearchCard({
  slug,
  title,
  stats,
  members,
  isChild = false,
  className,
}: ResearchCardProps) {
  const visibleMembers = members.slice(0, MAX_AVATARS);
  const remainingCount = Math.max(0, members.length - MAX_AVATARS);

  return (
    <Link
      href={`/research/${slug}`}
      className={cn(
        "group block rounded-lg border bg-card transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isChild && "border-dashed",
        className
      )}
    >
      <div className={cn("p-4", isChild && "p-3")}>
        {/* Title */}
        <h3
          className={cn(
            "font-medium leading-snug transition-colors group-hover:text-primary",
            isChild ? "text-sm" : "text-base"
          )}
        >
          {title}
        </h3>

        {/* Stats Row */}
        <div
          className={cn(
            "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground",
            isChild ? "text-xs" : "text-sm"
          )}
        >
          {stats.publicationCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className={cn("h-3.5 w-3.5", isChild && "h-3 w-3")} />
              <span className="tabular-nums">{stats.publicationCount}</span>
              <span className="hidden sm:inline">
                {stats.publicationCount === 1 ? "paper" : "papers"}
              </span>
            </span>
          )}
          {stats.memberCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className={cn("h-3.5 w-3.5", isChild && "h-3 w-3")} />
              <span className="tabular-nums">{stats.memberCount}</span>
            </span>
          )}
          {stats.totalCitations > 0 && (
            <span className="flex items-center gap-1">
              <Quote className={cn("h-3.5 w-3.5", isChild && "h-3 w-3")} />
              <span className="tabular-nums">
                {formatCompactNumber(stats.totalCitations)}
              </span>
            </span>
          )}
        </div>

        {/* Member Avatars */}
        {members.length > 0 && (
          <div className="mt-3 flex items-center">
            <div className="flex -space-x-2">
              {visibleMembers.map(({ member }) => (
                <div
                  key={member.id}
                  className={cn(
                    "relative rounded-full border-2 border-card bg-muted",
                    isChild ? "h-6 w-6" : "h-7 w-7"
                  )}
                  title={member.name}
                >
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes={isChild ? "24px" : "28px"}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
                        isChild ? "text-[9px]" : "text-[10px]"
                      )}
                    >
                      {getInitials(member.name)}
                    </span>
                  )}
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground",
                    isChild ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]"
                  )}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
