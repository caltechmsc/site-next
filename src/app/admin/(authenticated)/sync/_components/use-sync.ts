/**
 * Sync Hook
 *
 * Client-side SSE connection manager for real-time sync progress.
 * Handles connection lifecycle, event parsing, and state management.
 */

"use client";

import { useState, useCallback, useRef } from "react";

import type { SyncMode, SyncEvent, SyncSummary } from "@/lib/publications/sync";

// ============================================================================
// Types
// ============================================================================

/** Current lifecycle phase of a sync operation */
export type SyncStatus = "idle" | "running" | "complete" | "error";

/** Result of a single DOI metadata sync */
export interface SyncItemResult {
  index: number;
  doi: string;
  status: "ok" | "skip" | "error";
  detail?: string;
}

/** Full client-side state for the sync UI */
export interface SyncState {
  /** Current sync status */
  status: SyncStatus;
  /** Active phase label */
  phase: string | null;
  /** Progress: current item number */
  current: number;
  /** Progress: total items */
  total: number;
  /** Current item label */
  label: string;
  /** Completed item results (metadata phase) */
  items: SyncItemResult[];
  /** Relationship counts (after rebuild) */
  relationships: {
    pubMember: number;
    pubArea: number;
    memberArea: number;
  } | null;
  /** Final summary (after completion) */
  summary: SyncSummary | null;
  /** Error message (if failed) */
  error: string | null;
}

/** Return type of the {@link useSync} hook */
export interface UseSyncReturn {
  state: SyncState;
  startSync: (mode: SyncMode) => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: SyncState = {
  status: "idle",
  phase: null,
  current: 0,
  total: 0,
  label: "",
  items: [],
  relationships: null,
  summary: null,
  error: null,
};

// ============================================================================
// Hook
// ============================================================================

/**
 * SSE-based sync state manager.
 */
export function useSync(): UseSyncReturn {
  const [state, setState] = useState<SyncState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const startSync = useCallback((mode: SyncMode) => {
    // Abort any existing connection
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state
    setState({
      ...INITIAL_STATE,
      status: "running",
    });

    // Start SSE connection
    fetch("/api/admin/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: SyncEvent = JSON.parse(line.slice(6));
              handleEvent(event, setState);
            } catch {
              // Skip malformed events
            }
          }
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Connection failed",
        }));
      });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { state, startSync, reset };
}

// ============================================================================
// Event Handler
// ============================================================================

function handleEvent(
  event: SyncEvent,
  setState: React.Dispatch<React.SetStateAction<SyncState>>
) {
  switch (event.type) {
    case "phase":
      setState((prev) => ({
        ...prev,
        phase:
          event.phase === "metadata"
            ? "Syncing Metadata"
            : "Building Relationships",
        current: 0,
        total: event.total,
        label: "",
      }));
      break;

    case "progress":
      setState((prev) => ({
        ...prev,
        current: event.current,
        total: event.total,
        label: event.label,
      }));
      break;

    case "item-done":
      setState((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            index: event.index,
            doi: event.doi,
            status: event.status,
            detail: event.detail,
          },
        ],
      }));
      break;

    case "relationships-built":
      setState((prev) => ({
        ...prev,
        relationships: {
          pubMember: event.pubMember,
          pubArea: event.pubArea,
          memberArea: event.memberArea,
        },
      }));
      break;

    case "complete":
      setState((prev) => ({
        ...prev,
        status: "complete",
        summary: event.summary,
      }));
      break;

    case "error":
      setState((prev) => ({
        ...prev,
        status: "error",
        error: event.message,
      }));
      break;
  }
}
