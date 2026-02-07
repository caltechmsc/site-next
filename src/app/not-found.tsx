import Link from "next/link";
import { Home, Search, BookOpen, Users, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";

// ============================================================================
// 404 Page
// ============================================================================

/**
 * Global not-found page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Decorative: broken molecular bond */}
      <div className="relative mb-8 select-none" aria-hidden="true">
        <svg
          width="280"
          height="120"
          viewBox="0 0 280 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground/20"
        >
          {/* Left atom */}
          <circle
            cx="50"
            cy="60"
            r="24"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="60"
            r="8"
            className="fill-primary/20 stroke-primary"
            strokeWidth="1.5"
          />

          {/* Broken bond (dashed line) */}
          <line
            x1="74"
            y1="60"
            x2="130"
            y2="60"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Spark / break point */}
          <path
            d="M132 50 L138 60 L132 70 M148 50 L142 60 L148 70"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-primary/40"
          />

          {/* Right atom (displaced) */}
          <circle
            cx="230"
            cy="60"
            r="24"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="230"
            cy="60"
            r="8"
            className="fill-primary/20 stroke-primary"
            strokeWidth="1.5"
          />

          {/* Broken bond right side */}
          <line
            x1="150"
            y1="60"
            x2="206"
            y2="60"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Small floating electrons */}
          <circle cx="100" cy="38" r="3" className="fill-primary/30" />
          <circle cx="180" cy="82" r="2.5" className="fill-primary/20" />
          <circle cx="160" cy="30" r="2" className="fill-muted-foreground/30" />
        </svg>
      </div>

      {/* Error message */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Bond Broken — Error 404
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Like an unstable compound, this link has decomposed.
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/research">
            <Search className="mr-2 h-4 w-4" />
            Browse Research
          </Link>
        </Button>
      </div>

      {/* Quick navigation */}
      <div className="mt-12 w-full max-w-md">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Or jump to
        </p>
        <div className="grid grid-cols-3 gap-3">
          <QuickLink
            href="/publications"
            icon={BookOpen}
            label="Publications"
          />
          <QuickLink href="/members" icon={Users} label="Members" />
          <QuickLink href="/research" icon={FlaskConical} label="Research" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-component
// ============================================================================

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
