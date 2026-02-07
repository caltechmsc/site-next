/**
 * Sync Progress Panel
 *
 * Real-time progress display during sync operations.
 */

"use client";

import { useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  Loader2,
  Link2,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { SyncState, SyncStatus } from "./use-sync";

// ============================================================================
// Types
// ============================================================================

export interface SyncProgressPanelProps {
  state: SyncState;
  onReset: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function SyncProgressPanel({ state, onReset }: SyncProgressPanelProps) {
  const {
    status,
    phase,
    current,
    total,
    label,
    items,
    relationships,
    summary,
    error,
  } = state;

  if (status === "idle") return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        Progress
      </h2>
      <Card>
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2.5">
            <StatusIcon status={status} />
            <div>
              <CardTitle className="text-sm font-semibold">
                {status === "running"
                  ? (phase ?? "Starting…")
                  : statusLabel(status)}
              </CardTitle>
              {status === "running" && label && (
                <p className="text-xs text-muted-foreground">{label}</p>
              )}
            </div>
          </div>

          {status !== "running" && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Dismiss
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {status === "running" && total > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {current} / {total}
                </span>
                <span>{Math.round((current / total) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${(current / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Item Log (metadata phase) */}
          {items.length > 0 && <ItemLog items={items} />}

          {/* Relationship Result */}
          {relationships && !summary && (
            <RelationshipSummary {...relationships} />
          )}

          {/* Final Summary */}
          {summary && <SyncSummaryView summary={summary} />}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatusIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
}

function statusLabel(status: SyncStatus): string {
  switch (status) {
    case "complete":
      return "Sync Complete";
    case "error":
      return "Sync Failed";
    default:
      return "Sync";
  }
}

function ItemLog({ items }: { items: SyncState["items"] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = containerRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [items.length]);

  return (
    <div ref={containerRef}>
      <ScrollArea className="h-48">
        <div className="space-y-0.5 pr-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded px-2 py-1 text-xs"
            >
              <ItemStatusIcon status={item.status} />
              <span className="shrink-0 font-mono text-muted-foreground">
                #{item.index}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  item.status === "error" && "text-destructive",
                  item.status === "skip" && "text-muted-foreground"
                )}
              >
                {item.detail ?? item.doi}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ItemStatusIcon({ status }: { status: "ok" | "skip" | "error" }) {
  switch (status) {
    case "ok":
      return (
        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
      );
    case "skip":
      return <SkipForward className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />;
    case "error":
      return <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />;
  }
}

function RelationshipSummary({
  pubMember,
  pubArea,
  memberArea,
}: {
  pubMember: number;
  pubArea: number;
  memberArea: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <Link2 className="h-4 w-4 text-blue-500" />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="font-medium text-foreground">{pubMember}</strong>{" "}
          pub↔member
        </span>
        <span>
          <strong className="font-medium text-foreground">{pubArea}</strong>{" "}
          pub↔area
        </span>
        <span>
          <strong className="font-medium text-foreground">{memberArea}</strong>{" "}
          member↔area
        </span>
      </div>
    </div>
  );
}

function SyncSummaryView({
  summary,
}: {
  summary: NonNullable<SyncState["summary"]>;
}) {
  const duration = (summary.durationMs / 1000).toFixed(1);

  return (
    <div className="space-y-3">
      {/* Duration */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Completed in {duration}s</span>
      </div>

      {/* Metadata summary */}
      {summary.metadata && (
        <div className="grid grid-cols-4 gap-2">
          <SummaryStat label="Total" value={summary.metadata.total} />
          <SummaryStat
            label="Updated"
            value={summary.metadata.updated}
            accent="emerald"
          />
          <SummaryStat
            label="Skipped"
            value={summary.metadata.skipped}
            accent="amber"
          />
          <SummaryStat
            label="Failed"
            value={summary.metadata.failed}
            accent={summary.metadata.failed > 0 ? "red" : undefined}
          />
        </div>
      )}

      {/* Relationships summary */}
      {summary.relationships && (
        <RelationshipSummary {...summary.relationships} />
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "red";
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
      <div
        className={cn(
          "text-base font-semibold",
          accent === "emerald" && "text-emerald-600 dark:text-emerald-400",
          accent === "amber" && "text-amber-600 dark:text-amber-400",
          accent === "red" && "text-destructive"
        )}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
