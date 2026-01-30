import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Quote,
  ExternalLink,
  Users,
  FlaskConical,
} from "lucide-react";

import {
  getPublicationByDoi,
  getAllPublicationDois,
} from "@/lib/db/queries/publications";
import {
  createPublicationMetadata,
  createNotFoundMetadata,
} from "@/lib/metadata";
import { parseAuthors, getInitials, formatCompactNumber } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CitationBox } from "@/components/publication";

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  params: Promise<{ doi: string }>;
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { doi } = await params;
  const decodedDoi = decodeURIComponent(doi);
  const publication = await getPublicationByDoi(decodedDoi);

  if (!publication) {
    return createNotFoundMetadata("Publication");
  }

  return createPublicationMetadata(publication);
}

// ============================================================================
// Static Paths
// ============================================================================

export async function generateStaticParams() {
  const dois = await getAllPublicationDois();
  return dois.map((doi) => ({ doi: encodeURIComponent(doi) }));
}

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function PublicationDetailPage({ params }: PageProps) {
  const { doi } = await params;
  const decodedDoi = decodeURIComponent(doi);
  const publication = await getPublicationByDoi(decodedDoi);

  if (!publication) {
    notFound();
  }

  const authors = parseAuthors(publication.authors);
  const year = new Date(publication.date).getFullYear();
  const hasMembers = publication.members.length > 0;
  const hasAreas = publication.researchAreas.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
        <Link href="/publications">
          <ArrowLeft className="mr-1 h-4 w-4" />
          All Publications
        </Link>
      </Button>

      {/* Article Header */}
      <article>
        <header className="space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {publication.title}
          </h1>

          {/* Authors */}
          <p className="text-muted-foreground">{authors.join(", ")}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {/* Year */}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {year}
            </span>

            {/* Journal */}
            {publication.journal && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span className="italic">{publication.journal}</span>
                {publication.volume && (
                  <span>
                    , {publication.volume}
                    {publication.issue && `(${publication.issue})`}
                    {publication.pages && `, ${publication.pages}`}
                  </span>
                )}
              </span>
            )}

            {/* Citations */}
            {publication.citations > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Quote className="h-4 w-4" />
                <span className="tabular-nums">
                  {formatCompactNumber(publication.citations)}
                </span>
                cited
              </span>
            )}
          </div>

          {/* DOI Badge */}
          <div className="flex items-center gap-2">
            <a
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              DOI: {publication.doi}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        <Separator className="my-8" />

        {/* Abstract */}
        {publication.abstract && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Abstract</h2>
            <p className="leading-relaxed text-muted-foreground">
              {publication.abstract}
            </p>
          </section>
        )}

        {/* Related Members */}
        {hasMembers && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-muted-foreground" />
              Group Members
            </h2>
            <div className="flex flex-wrap gap-3">
              {publication.members.map(({ member }) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="group flex items-center gap-2 rounded-lg border bg-card p-2 pr-4 transition-colors hover:border-primary/50"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {member.photo ? (
                      <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                      {member.name}
                    </p>
                    {member.position && (
                      <p className="truncate text-xs text-muted-foreground">
                        {member.position}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Research Areas */}
        {hasAreas && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FlaskConical className="h-5 w-5 text-muted-foreground" />
              Research Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {publication.researchAreas.map(({ researchArea }) => (
                <Link
                  key={researchArea.id}
                  href={`/research/${researchArea.slug}`}
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-primary/20 hover:text-primary"
                  >
                    {researchArea.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Citation Box */}
        <section>
          <CitationBox
            data={{
              doi: publication.doi,
              title: publication.title,
              authors: parseAuthors(publication.authors),
              date: publication.date,
              journal: publication.journal,
              volume: publication.volume,
              issue: publication.issue,
              pages: publication.pages,
            }}
          />
        </section>
      </article>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: publication.title,
            author: authors.map((name) => ({
              "@type": "Person",
              name,
            })),
            datePublished: publication.date,
            publisher: {
              "@type": "Organization",
              name: siteConfig.fullName,
            },
            ...(publication.journal && {
              isPartOf: {
                "@type": "Periodical",
                name: publication.journal,
              },
            }),
            ...(publication.abstract && {
              description: publication.abstract,
            }),
            identifier: {
              "@type": "PropertyValue",
              propertyID: "DOI",
              value: publication.doi,
            },
            url: `https://doi.org/${publication.doi}`,
          }),
        }}
      />
    </div>
  );
}
