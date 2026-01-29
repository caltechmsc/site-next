/**
 * Member Card Component
 *
 * Displays a member in a photo card format.
 * Used in the members grid on the list page.
 */

import Link from "next/link";
import Image from "next/image";
import type { MemberWithCategory } from "@/types";
import { cn } from "@/lib/utils";

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
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-light text-muted-foreground/50">
              {getInitials(member.name)}
            </span>
          </div>
        )}

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

// ============================================================================
// Utilities
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTenure(startDate: Date, endDate: Date | null): string {
  const startYear = new Date(startDate).getFullYear();
  if (!endDate) {
    return `${startYear} - Present`;
  }
  const endYear = new Date(endDate).getFullYear();
  return startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;
}
