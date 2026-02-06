/**
 * Recent Activity Component
 *
 * Displays recently added members and publications in a two-column layout.
 */

"use client";

import Link from "next/link";
import { Users, FileText, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberPortrait } from "@/components/ui/member-portrait";
import { EmptyState } from "@/components/admin/shared";
import type { RecentMember, RecentPublication } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface RecentActivityProps {
  /** Recently added members */
  recentMembers: RecentMember[];
  /** Recently published papers */
  recentPublications: RecentPublication[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse authors from JSON array string and format for display.
 * Handles both JSON array (`["A","B"]`) and plain string fallback.
 */
function formatAuthors(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (parsed.length === 1) return String(parsed[0]);
      return `${parsed[0]} et al.`;
    }
  } catch {
    // Not JSON — try semicolon / comma fallback
    const parts = raw
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 1) return `${parts[0]} et al.`;
    return raw;
  }
  return raw;
}

// ============================================================================
// Component
// ============================================================================

export function RecentActivity({
  recentMembers,
  recentPublications,
}: RecentActivityProps) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        Recent Activity
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Members
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-auto p-0" asChild>
              <Link
                href="/admin/members"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Members Yet"
                description="Members will appear here once added."
                className="border-none p-4"
              />
            ) : (
              <div className="-mx-2 space-y-1">
                {recentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    <MemberPortrait
                      name={member.name}
                      photo={member.photo}
                      size="sm"
                      variant="circle"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.position ?? "No position"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {member.categoryName}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Publications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Publications
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-auto p-0" asChild>
              <Link
                href="/publications"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View site
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPublications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Publications Yet"
                description="Publications will appear here once synced."
                className="border-none p-4"
              />
            ) : (
              <div className="-mx-2 space-y-1">
                {recentPublications.map((pub) => (
                  <div
                    key={pub.doi}
                    className="rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    <p className="truncate text-sm font-medium">{pub.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatAuthors(pub.authors)}
                      {pub.journal && (
                        <>
                          <span className="mx-1 text-muted-foreground/50">
                            ·
                          </span>
                          {pub.journal}
                        </>
                      )}
                      <span className="mx-1 text-muted-foreground/50">·</span>
                      {pub.date.substring(0, 4)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
