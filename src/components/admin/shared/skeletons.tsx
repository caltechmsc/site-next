/**
 * Admin Skeleton Components
 *
 * Loading skeletons for admin pages.
 * Match the structure of actual content for smooth transitions.
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Basic Skeletons
// ============================================================================

/**
 * Single list item skeleton.
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

/**
 * List with multiple items.
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y rounded-lg border">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// Card Skeletons
// ============================================================================

/**
 * Stat card skeleton (for dashboard).
 */
export function StatCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-6">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Simple card skeleton.
 */
export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// ============================================================================
// Page-Specific Skeletons
// ============================================================================

/**
 * Dashboard page skeleton.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Chart Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="mt-4 h-[280px] w-full rounded-lg" />
        <div className="mt-3 flex items-center justify-center gap-6">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Member list page skeleton.
 */
export function MemberListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-md" />
        ))}
      </div>

      {/* Category Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <ListSkeleton count={4} />
      </div>
    </div>
  );
}

/**
 * Research tree page skeleton.
 */
export function ResearchTreeSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="ml-auto h-6 w-16 rounded-md" />
          </div>
          {/* Sub-items */}
          <div className="ml-8 space-y-2 border-l pl-4">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Photo grid page skeleton.
 */
export function PhotoGridSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, yearIndex) => (
        <div key={yearIndex} className="space-y-4">
          {/* Year Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, photoIndex) => (
              <div key={photoIndex} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Collaborator list page skeleton.
 */
export function CollaboratorListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 max-w-xs flex-1" />
      </div>

      {/* List */}
      <ListSkeleton count={6} />
    </div>
  );
}

/**
 * Administrator list page skeleton.
 */
export function AdminListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* List */}
      <ListSkeleton count={3} />
    </div>
  );
}

/**
 * Form skeleton (for edit dialogs/pages).
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// ============================================================================
// Page Header Skeleton
// ============================================================================

/**
 * Page header with title and action button.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Complete page skeleton with header.
 */
export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      {children ?? <ListSkeleton />}
    </div>
  );
}
