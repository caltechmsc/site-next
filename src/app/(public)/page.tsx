import Link from "next/link";
import { ArrowRight, BookOpen, Users, FlaskConical, Quote } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { formatCompactNumber, parseAuthors } from "@/lib/format";

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

async function getStats() {
  try {
    const [publicationCount, memberCount, researchAreaCount, totalCitations] =
      await Promise.all([
        prisma.publication.count(),
        prisma.member.count({ where: { isHidden: false } }),
        prisma.researchArea.count({ where: { isHidden: false } }),
        prisma.publication.aggregate({ _sum: { citations: true } }),
      ]);

    return {
      publications: publicationCount,
      members: memberCount,
      researchAreas: researchAreaCount,
      citations: totalCitations._sum.citations ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return {
      publications: 0,
      members: 0,
      researchAreas: 0,
      citations: 0,
    };
  }
}

async function getRecentPublications() {
  try {
    return await prisma.publication.findMany({
      orderBy: { date: "desc" },
      take: 5,
      select: {
        doi: true,
        title: true,
        authors: true,
        date: true,
        journal: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch recent publications:", error);
    return [];
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function HomePage() {
  const [stats, recentPublications] = await Promise.all([
    getStats(),
    getRecentPublications(),
  ]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative border-b">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${siteConfig.images.heroBackground})`,
          }}
        >
          <div className="dark:from-background/98 absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60 dark:via-background/90 dark:to-background/70" />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {siteConfig.fullName}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              Developing and applying advanced simulation methods to solve
              fundamental problems in chemistry, materials science, and biology.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/research">
                  Explore Research
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/publications">View Publications</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              href="/publications"
              value={stats.publications}
              label="Publications"
              icon={BookOpen}
            />
            <StatCard
              href="/members"
              value={stats.members}
              label="Members"
              icon={Users}
            />
            <StatCard
              href="/research"
              value={stats.researchAreas}
              label="Research Areas"
              icon={FlaskConical}
            />
            <StatCard
              href="/publications"
              value={formatCompactNumber(stats.citations)}
              label="Citations"
              icon={Quote}
            />
          </div>
        </div>
      </section>

      {/* Recent Publications */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Publications</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/publications">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {recentPublications.map((pub) => (
              <PublicationRow key={pub.doi} publication={pub} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLinkCard
              href="/about/wag"
              title="Prof. William A. Goddard III"
              description="Director of the Materials and Process Simulation Center"
            />
            <QuickLinkCard
              href="/about/msc"
              title="About MSC"
              description="Learn about our center's mission and history"
            />
            <QuickLinkCard
              href="/collaborators"
              title="Collaborators"
              description="Our global network of research partners"
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

interface StatCardProps {
  href: string;
  value: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ href, value, label, icon: Icon }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Link>
  );
}

interface PublicationRowProps {
  publication: {
    doi: string;
    title: string;
    authors: string;
    date: Date;
    journal: string | null;
  };
}

function PublicationRow({ publication }: PublicationRowProps) {
  const year = publication.date.getFullYear();
  const authors = parseAuthors(publication.authors);
  const displayAuthors =
    authors.length > 3
      ? `${authors.slice(0, 3).join(", ")}, et al.`
      : authors.join(", ");

  return (
    <Link
      href={`/publications/${encodeURIComponent(publication.doi)}`}
      className="group block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <p className="font-medium leading-snug group-hover:text-primary">
        {publication.title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {displayAuthors} • {year}
        {publication.journal && ` • ${publication.journal}`}
      </p>
    </Link>
  );
}

interface QuickLinkCardProps {
  href: string;
  title: string;
  description: string;
}

function QuickLinkCard({ href, title, description }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <h3 className="font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
