/**
 * Publication Card Component
 *
 * Displays a publication in a compact card format.
 * Used in list views across the site.
 */

"use client";

import { useRouter } from "next/navigation";
import { Quote, ExternalLink } from "lucide-react";

import type { Publication, Member, ResearchArea } from "@/types";
import { cn } from "@/lib/utils";
import { parseAuthors, joinAuthors, formatCompactNumber } from "@/lib/format";
import { getYear } from "@/lib/date";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface PublicationCardProps {
  publication: Publication & {
    members?: { member: Pick<Member, "id" | "name"> }[];
    researchAreas?: {
      researchArea: Pick<ResearchArea, "id" | "slug" | "title">;
    }[];
  };
  /** Show research area badges */
  showAreas?: boolean;
  /** Highlight search terms */
  highlightTerms?: string[];
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PublicationCard({
  publication,
  showAreas = false,
  highlightTerms,
  className,
}: PublicationCardProps) {
  const router = useRouter();
  const authors = parseAuthors(publication.authors);
  const year = getYear(publication.date);
  const detailUrl = `/publications/${publication.index}`;
  const doiUrl = publication.doi ? `https://doi.org/${publication.doi}` : null;

  const handleCardClick = () => {
    router.push(detailUrl);
  };

  const handleDoiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (doiUrl) {
      window.open(doiUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md hover:shadow-primary/5",
        className
      )}
    >
      {/* Title */}
      <h3 className="font-medium leading-snug transition-colors group-hover:text-primary">
        {highlightTerms
          ? highlightText(publication.title, highlightTerms)
          : publication.title}
      </h3>

      {/* Authors */}
      <p className="mt-1.5 text-sm text-muted-foreground">
        {joinAuthors(authors, 5)}
      </p>

      {/* Meta row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {/* Index */}
        <span className="font-medium tabular-nums">#{publication.index}</span>

        {/* Year */}
        <span className="text-border">·</span>
        <span className="font-medium tabular-nums">{year}</span>

        {/* Journal */}
        {publication.journal && (
          <>
            <span className="text-border">·</span>
            <span className="italic">{publication.journal}</span>
          </>
        )}

        {/* Citations */}
        {publication.citations > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Quote className="h-3 w-3" />
              <span className="tabular-nums">
                {formatCompactNumber(publication.citations)}
              </span>
              <span className="hidden sm:inline">cited</span>
            </span>
          </>
        )}

        {/* DOI link */}
        {doiUrl && (
          <button
            onClick={handleDoiClick}
            className="ml-auto flex items-center gap-1 text-primary/70 transition-colors hover:text-primary"
          >
            <span className="hidden sm:inline">DOI</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Research areas */}
      {showAreas &&
        publication.researchAreas &&
        publication.researchAreas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {publication.researchAreas.slice(0, 3).map(({ researchArea }) => (
              <Badge
                key={researchArea.id}
                variant="secondary"
                className="text-xs font-normal"
              >
                {researchArea.title}
              </Badge>
            ))}
            {publication.researchAreas.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{publication.researchAreas.length - 3}
              </Badge>
            )}
          </div>
        )}
    </article>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function highlightText(
  text: string,
  terms: string[]
): (string | React.ReactElement)[] {
  if (!terms.length) return [text];

  const regex = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = terms.some(
      (term) => part.toLowerCase() === term.toLowerCase()
    );
    if (isMatch) {
      return (
        <mark key={index} className="bg-primary/20 text-inherit">
          {part}
        </mark>
      );
    }
    return part;
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
