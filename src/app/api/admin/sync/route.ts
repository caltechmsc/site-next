/**
 * POST /api/admin/sync
 *
 * Server-Sent Events (SSE) endpoint for publication data synchronization.
 * Streams real-time progress events to the client during sync operations.
 *
 * Authentication: JWT access token (via middleware).
 * Concurrency: Global lock prevents parallel sync operations.
 */

import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  runSync,
  isSyncRunning,
  type SyncMode,
  type SyncEvent,
} from "@/lib/publications/sync";

// ============================================================================
// Validation
// ============================================================================

const VALID_MODES: SyncMode[] = ["metadata", "relationships", "full"];

function isValidMode(mode: unknown): mode is SyncMode {
  return typeof mode === "string" && VALID_MODES.includes(mode as SyncMode);
}

// ============================================================================
// Handler
// ============================================================================

export async function POST(request: NextRequest) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let mode: SyncMode;
  try {
    const body = await request.json();
    if (!isValidMode(body.mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Expected: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }
    mode = body.mode;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Check global lock
  if (isSyncRunning()) {
    return NextResponse.json(
      { error: "A sync operation is already in progress" },
      { status: 409 }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      /** Send an SSE event to the client */
      function send(event: SyncEvent) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed by client — safe to ignore
        }
      }

      // Run sync with progress callback
      runSync(mode, send).finally(() => {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ============================================================================
// Status Check
// ============================================================================

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ syncing: isSyncRunning() });
}
