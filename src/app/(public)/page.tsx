import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Users,
  FlaskConical,
  Quote,
  Globe,
  GraduationCap,
  Beaker,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { formatCompactNumber, parseAuthors } from "@/lib/format";
import { getYear } from "@/lib/date";
import { createPageMetadata } from "@/lib/metadata";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  path: "/",
});

// ============================================================================
// Page Configuration
// ============================================================================

/**
 * Revalidate every 5 minutes (300 seconds)
 */
export const revalidate = 300;

// ============================================================================
// Data Fetching
// ============================================================================

async function getHomeData() {
  try {
    const [
      publicationCount,
      memberCount,
      researchAreaCount,
      collaboratorCount,
      totalCitations,
      recentPublications,
      researchAreas,
    ] = await Promise.all([
      prisma.publication.count(),
      prisma.member.count({ where: { isHidden: false } }),
      prisma.researchArea.count({
        where: { isHidden: false, parentId: null },
      }),
      prisma.collaborator.count({ where: { isHidden: false } }),
      prisma.publication.aggregate({ _sum: { citations: true } }),
      prisma.publication.findMany({
        orderBy: { date: "desc" },
        take: 5,
        select: {
          index: true,
          doi: true,
          title: true,
          authors: true,
          date: true,
          journal: true,
        },
      }),
      prisma.researchArea.findMany({
        where: { isHidden: false, parentId: null },
        orderBy: { order: "asc" },
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          _count: { select: { publications: true, members: true } },
        },
      }),
    ]);

    return {
      stats: {
        publications: publicationCount,
        members: memberCount,
        researchAreas: researchAreaCount,
        collaborators: collaboratorCount,
        citations: totalCitations._sum.citations ?? 0,
      },
      recentPublications,
      researchAreas,
    };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return {
      stats: {
        publications: 0,
        members: 0,
        researchAreas: 0,
        collaborators: 0,
        citations: 0,
      },
      recentPublications: [],
      researchAreas: [],
    };
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function HomePage() {
  const { stats, recentPublications, researchAreas } = await getHomeData();

  return (
    <>
      {/* Hero Section */}
      <section className="relative border-b">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={siteConfig.images.heroBackground}
            alt="MSC group photo"
            fill
            className="object-cover"
            priority
            quality={85}
          />
          <div className="dark:from-background/98 absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60 dark:via-background/90 dark:to-background/70" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              California Institute of Technology
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {siteConfig.fullName}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Developing and applying first-principles simulation methods to
              solve fundamental problems in chemistry, materials science, and
              biology.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/research">
                  Explore Research
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about/msc">About the Center</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatItem
              value={stats.publications}
              label="Publications"
              icon={BookOpen}
            />
            <StatItem
              value={formatCompactNumber(stats.citations)}
              label="Citations"
              icon={Quote}
            />
            <StatItem
              value={stats.researchAreas}
              label="Research Areas"
              icon={FlaskConical}
            />
            <StatItem value={stats.members} label="Members" icon={Users} />
            <StatItem
              value={stats.collaborators}
              label="Collaborators"
              icon={Globe}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </section>

      {/* Research Highlights */}
      {researchAreas.length > 0 && (
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionHeader
              title="Research Areas"
              description="Our work spans computational chemistry, materials design, and biological simulation — bridging theory and application."
              href="/research"
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {researchAreas.map((area) => (
                <ResearchAreaCard key={area.id} area={area} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Publications */}
      {recentPublications.length > 0 && (
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <SectionHeader
              title="Recent Publications"
              description={`Our researchers have published ${formatCompactNumber(stats.publications)} papers with ${formatCompactNumber(stats.citations)} total citations.`}
              href="/publications"
            />

            <div className="mt-8 space-y-3">
              {recentPublications.map((pub, i) => (
                <PublicationRow key={pub.index} publication={pub} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About the Center */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Our Mission
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Advancing Science Through Simulation
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                The MSC develops quantum mechanics and molecular dynamics
                methods to predict and explain chemical, biological, and
                materials phenomena — aiming to reduce the need for costly
                experiments by providing accurate computational models.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Founded and directed by Prof. William A. Goddard III, the center
                brings together researchers across disciplines to tackle
                challenges ranging from catalyst design to drug discovery.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/about/wag">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Prof. Goddard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/about/msc">
                    <Beaker className="mr-2 h-4 w-4" />
                    About MSC
                  </Link>
                </Button>
              </div>
            </div>

            {/* Beckman Institute image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border shadow-sm">
              <Image
                src="/images/beckman.jpg"
                alt="Beckman Institute at Caltech"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              href="/members"
              title="Members"
              description="Current and former researchers, students, and staff"
              icon={Users}
            />
            <QuickLinkCard
              href="/collaborators"
              title="Collaborators"
              description="Our global network of research partners"
              icon={Globe}
            />
            <QuickLinkCard
              href="/events/photos"
              title="Group Photos"
              description="Memories from conferences, gatherings, and lab life"
              icon={GraduationCap}
            />
            <QuickLinkCard
              href="/events/calendar"
              title="Calendar"
              description="Upcoming seminars, meetings, and events"
              icon={Beaker}
            />
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/** Section heading with optional "View all" link */
function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 self-start sm:self-auto"
        asChild
      >
        <Link href={href}>
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

/** Stats bar item */
function StatItem({
  value,
  label,
  icon: Icon,
  className,
}: {
  value: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <Icon className="h-5 w-5 shrink-0 text-primary/70" />
      <div>
        <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Research area card */
function ResearchAreaCard({
  area,
}: {
  area: {
    slug: string;
    title: string;
    content: string | null;
    _count: { publications: number; members: number };
  };
}) {
  // Extract first sentence from markdown content as summary
  const summary = area.content
    ? area.content
        .replace(/^#+\s.+$/gm, "") // strip markdown headings
        .replace(/[*_`]/g, "") // strip markdown formatting
        .trim()
        .split(/(?<=[.!?])\s/)[0] // first sentence
        ?.slice(0, 140) || null
    : null;

  return (
    <Link
      href={`/research/${area.slug}`}
      className="group flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <h3 className="font-semibold leading-snug group-hover:text-primary">
        {area.title}
      </h3>
      {summary && (
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {summary}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {area._count.publications > 0 && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {area._count.publications}
          </span>
        )}
        {area._count.members > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {area._count.members}
          </span>
        )}
      </div>
    </Link>
  );
}

/** Publication row */
function PublicationRow({
  publication,
  index,
}: {
  publication: {
    index: number;
    doi: string | null;
    title: string;
    authors: string;
    date: string;
    journal: string | null;
  };
  index: number;
}) {
  const year = getYear(publication.date);
  const authors = parseAuthors(publication.authors);
  const displayAuthors =
    authors.length > 3
      ? `${authors.slice(0, 3).join(", ")}, et al.`
      : authors.join(", ");

  return (
    <Link
      href={`/publications/${publication.index}`}
      className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <span className="mt-0.5 hidden text-xs font-medium tabular-nums text-muted-foreground/60 sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug group-hover:text-primary">
          {publication.title}
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {displayAuthors} · {year}
          {publication.journal && ` · ${publication.journal}`}
        </p>
      </div>
    </Link>
  );
}

/** Quick link card */
function QuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      <div>
        <h3 className="font-semibold group-hover:text-primary">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
