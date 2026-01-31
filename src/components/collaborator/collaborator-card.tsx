/**
 * Collaborator Card Component
 *
 * Displays a collaborator in a compact card format.
 * Features subtle hover effects and clear information hierarchy.
 */

import { MapPin, User, ExternalLink, Mail } from "lucide-react";
import type { CollaboratorWithCoords } from "@/lib/db/queries/collaborators";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface CollaboratorCardProps {
  collaborator: CollaboratorWithCoords;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CollaboratorCard({
  collaborator,
  isSelected,
  onClick,
  className,
}: CollaboratorCardProps) {
  const location = [collaborator.city, collaborator.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 transition-all duration-200",
        isSelected
          ? "border-primary shadow-md shadow-primary/10"
          : "hover:border-primary/50 hover:shadow-md hover:shadow-primary/5",
        className
      )}
    >
      {/* Organization */}
      <h3 className="font-medium leading-snug transition-colors group-hover:text-primary">
        {collaborator.organization}
      </h3>

      {/* Leader */}
      {collaborator.leader && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{collaborator.leader}</span>
        </p>
      )}

      {/* Location */}
      {location && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      )}

      {/* Links */}
      {(collaborator.website || collaborator.email) && (
        <div className="mt-3 flex items-center gap-3 border-t pt-3">
          {collaborator.website && (
            <a
              href={collaborator.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-primary/80 transition-colors hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Website</span>
            </a>
          )}
          {collaborator.email && (
            <a
              href={`mailto:${collaborator.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-primary/80 transition-colors hover:text-primary"
            >
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </a>
          )}
        </div>
      )}

      {/* Coordinates indicator */}
      {collaborator.hasCoords && (
        <div className="mt-2 text-[10px] text-muted-foreground/60">
          Click to view on map
        </div>
      )}
    </article>
  );
}
