/**
 * Member Card Component
 *
 * Displays a member in a photo card format.
 * Used in the members grid on the list page.
 */

import Link from "next/link";
import type { MemberWithCategory } from "@/types";
import { cn } from "@/lib/utils";
import { formatTenure } from "@/lib/date";
import { MemberPortrait } from "@/components/ui/member-portrait";

// ============================================================================
// Types
// ============================================================================

interface MemberCardProps {
  member: MemberWithCategory;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function MemberCard({ member, className }: MemberCardProps) {
  const isActive = !member.endDate;
  const tenure = formatTenure(member.startDate, member.endDate);

  return (
    <Link
      href={`/members/${member.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-lg border bg-card transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Photo Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <MemberPortrait
          name={member.name}
          photo={member.photo}
          size="fill"
          variant="portrait"
          hoverScale
          className="rounded-none"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />

        {/* Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <h3 className="font-medium leading-tight">{member.name}</h3>
          {member.position && (
            <p className="mt-0.5 line-clamp-1 text-sm text-white/80">
              {member.position}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <span>{tenure}</span>
        {isActive && (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Active
          </span>
        )}
      </div>
    </Link>
  );
}
