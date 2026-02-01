import type { Metadata } from "next";
import { Calendar, ExternalLink } from "lucide-react";

import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "Events Calendar",
  description:
    "Upcoming events, seminars, and meetings at the Materials and Process Simulation Center.",
  path: "/events/calendar",
});

// ============================================================================
// Page Component
// ============================================================================

export default function CalendarPage() {
  const calendarSrc = siteConfig.calendarUrl;
  const calendarId = extractCalendarId(calendarSrc);
  const externalUrl = calendarId
    ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Events Calendar</h1>
            <p className="mt-2 text-muted-foreground">
              Upcoming events, seminars, group meetings, and important dates at
              the MSC.
            </p>
          </div>

          {/* Add to Calendar button */}
          {externalUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Google Calendar</span>
                <span className="sm:hidden">Add</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Calendar Embed */}
      <div className="overflow-hidden rounded-lg border bg-card">
        {/* Desktop Calendar */}
        <div className="hidden md:block">
          <iframe
            src={`${calendarSrc}&mode=MONTH`}
            className="h-[600px] w-full border-0"
            title="MSC Events Calendar"
            loading="lazy"
          />
        </div>

        {/* Mobile Calendar (Agenda view) */}
        <div className="md:hidden">
          <iframe
            src={`${calendarSrc}&mode=AGENDA`}
            className="h-[500px] w-full border-0"
            title="MSC Events Calendar"
            loading="lazy"
          />
        </div>
      </div>

      {/* Helper Text */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Click an event to see details. Click &ldquo;Add to Google
        Calendar&rdquo; to add all events to your personal calendar.
      </p>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract calendar ID from Google Calendar embed URL.
 */
function extractCalendarId(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    return url.searchParams.get("src");
  } catch {
    return null;
  }
}
