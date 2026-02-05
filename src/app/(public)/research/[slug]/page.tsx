import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Users, Quote, ChevronRight } from "lucide-react";

import {
  getResearchAreaBySlug,
  getAllResearchAreaSlugs,
  getResearchAreaBreadcrumb,
} from "@/lib/db/queries/research";
import {
  createResearchAreaMetadata,
  createNotFoundMetadata,
} from "@/lib/metadata";
import { formatCompactNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/ui/markdown";
import { ResearchCard, ResearchMemberList } from "@/components/research";
import { PublicationsByYear } from "@/components/publication";

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = await getResearchAreaBySlug(slug);

  if (!area) {
    return createNotFoundMetadata("Research Area");
  }

  return createResearchAreaMetadata(area);
}

// ============================================================================
// Static Paths
// ============================================================================

export async function generateStaticParams() {
  const slugs = await getAllResearchAreaSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function ResearchAreaDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [area, breadcrumb] = await Promise.all([
    getResearchAreaBySlug(slug),
    getResearchAreaBreadcrumb(slug),
  ]);

  if (!area) {
    notFound();
  }

  const hasChildren = area.children.length > 0;
  const hasMembers = area.members.length > 0;
  const hasPublications = area.publications.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/research">
          <ArrowLeft className="mr-1 h-4 w-4" />
          All Research
        </Link>
      </Button>

      {/* Breadcrumb */}
      {breadcrumb.length > 1 && (
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            href="/research"
            className="transition-colors hover:text-foreground"
          >
            Research
          </Link>
          {breadcrumb.map((item, index) => (
            <span key={item.slug} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              {index === breadcrumb.length - 1 ? (
                <span className="text-foreground">{item.title}</span>
              ) : (
                <Link
                  href={`/research/${item.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {item.title}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{area.title}</h1>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {area.stats.publicationCount}
            </span>
            {area.stats.publicationCount === 1 ? "publication" : "publications"}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium tabular-nums text-foreground">
              {area.stats.memberCount}
            </span>
            {area.stats.memberCount === 1 ? "researcher" : "researchers"}
          </span>
          {area.stats.totalCitations > 0 && (
            <span className="flex items-center gap-2">
              <Quote className="h-4 w-4" />
              <span className="font-medium tabular-nums text-foreground">
                {formatCompactNumber(area.stats.totalCitations)}
              </span>
              citations
            </span>
          )}
        </div>

        {/* Keywords */}
        {area.keywords && (
          <div className="mt-4 flex flex-wrap gap-2">
            {parseKeywords(area.keywords).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      {area.content && (
        <>
          <section>
            <Markdown content={area.content} />
          </section>
          <Separator className="my-8" />
        </>
      )}

      {/* Child Areas */}
      {hasChildren && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Sub-areas</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {area.children.map((child) => (
                <ResearchCard
                  key={child.id}
                  slug={child.slug}
                  title={child.title}
                  stats={child.stats}
                  members={[]}
                  isChild={true}
                />
              ))}
            </div>
          </section>
          <Separator className="my-8" />
        </>
      )}

      {/* Members */}
      {hasMembers && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Researchers</h2>
            <ResearchMemberList members={area.members} />
          </section>
          <Separator className="my-8" />
        </>
      )}

      {/* Publications */}
      {hasPublications && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Publications</h2>
          <PublicationsByYear publications={area.publications} />
        </section>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function parseKeywords(keywordsJson: string): string[] {
  try {
    const parsed = JSON.parse(keywordsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
