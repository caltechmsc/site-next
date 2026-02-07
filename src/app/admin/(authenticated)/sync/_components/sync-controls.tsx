/**
 * Sync Controls
 *
 * Action cards for triggering sync operations.
 */

"use client";

import { RefreshCw, Link2, Zap, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SyncMode } from "@/lib/publications/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SyncStatus } from "./use-sync";

// ============================================================================
// Types
// ============================================================================

export interface SyncControlsProps {
  status: SyncStatus;
  onSync: (mode: SyncMode) => void;
}

// ============================================================================
// Component
// ============================================================================

export function SyncControls({ status, onSync }: SyncControlsProps) {
  const isRunning = status === "running";

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        Sync Operations
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Metadata Sync */}
        <OperationCard
          icon={RefreshCw}
          title="Sync Metadata"
          description="Fetch latest citation counts and keywords from OpenAlex/CrossRef for all publications with DOIs."
          buttonLabel="Run Metadata Sync"
          onClick={() => onSync("metadata")}
          disabled={isRunning}
        />

        {/* Relationship Rebuild */}
        <OperationCard
          icon={Link2}
          title="Rebuild Links"
          description="Rebuild all publication↔member, publication↔area, and member↔area relationships using matching algorithms."
          buttonLabel="Rebuild Links"
          onClick={() => onSync("relationships")}
          disabled={isRunning}
        />

        {/* Full Sync */}
        <OperationCard
          icon={Zap}
          title="Full Sync"
          description="Run metadata sync followed by relationship rebuild. Recommended for the most complete and up-to-date results."
          buttonLabel="Run Full Sync"
          onClick={() => onSync("full")}
          disabled={isRunning}
          primary
        />
      </div>
    </section>
  );
}

// ============================================================================
// Operation Card
// ============================================================================

function OperationCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
  disabled,
  primary = false,
}: {
  icon: typeof RefreshCw;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        primary && "border-primary/30 bg-primary/5"
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            primary
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Button
          variant={primary ? "default" : "outline"}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="w-full"
        >
          {disabled ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="mr-2 h-3.5 w-3.5" />
          )}
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
