import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Globe,
  ExternalLink,
  FileText,
  Quote,
  Calendar,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

import {
  getMemberById,
  getMemberPublicationStats,
  getMemberPublications,
  getAllMemberIds,
} from "@/lib/db/queries/members";
import { createMemberMetadata, createNotFoundMetadata } from "@/lib/metadata";
import { getInitials, formatTenure, formatCompactNumber } from "@/lib/format";
import { PublicationTimeline } from "@/components/member";
import { PublicationCard } from "@/components/publication";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ============================================================================
// Types
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberById(id);

  if (!member) {
    return createNotFoundMetadata("Member");
  }

  return createMemberMetadata(member);
}

// ============================================================================
// Static Paths
// ============================================================================

export async function generateStaticParams() {
  const ids = await getAllMemberIds();
  return ids.map((id) => ({ id }));
}

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Page Component
// ============================================================================

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [member, stats, publications] = await Promise.all([
    getMemberById(id),
    getMemberPublicationStats(id),
    getMemberPublications(id),
  ]);

  if (!member) {
    notFound();
  }

  const tenure = formatTenure(member.startDate, member.endDate);
  const isActive = !member.endDate;

  // Group publications by year
  const publicationsByYear = groupPublicationsByYear(publications);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
        <Link href="/members">
          <ArrowLeft className="mr-1 h-4 w-4" />
          All Members
        </Link>
      </Button>

      {/* Profile Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Photo */}
        <div className="relative h-40 w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-48 sm:w-36">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              priority
              sizes="144px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl font-light text-muted-foreground/50">
                {getInitials(member.name)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{member.name}</h1>
            {member.position && (
              <p className="mt-1 text-lg text-muted-foreground">
                {member.position}
              </p>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {tenure}
            </span>
            <span className="flex items-center gap-1.5">
              <Badge variant={isActive ? "default" : "secondary"}>
                {member.category.name}
              </Badge>
            </span>
          </div>

          {/* Contact Links */}
          <div className="flex flex-wrap gap-2 pt-1">
            {member.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${member.email}`}>
                  <Mail className="mr-1.5 h-4 w-4" />
                  Email
                </a>
              </Button>
            )}
            {member.website && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={member.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="mr-1.5 h-4 w-4" />
                  Website
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
            {member.orcid && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://orcid.org/${member.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ORCID
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <Separator className="my-8" />

      {/* Stats & Timeline Section */}
      {stats.totalPublications > 0 && (
        <>
          <section className="space-y-6">
            {/* Quick Stats */}
            <div className="flex items-baseline gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold tabular-nums">
                  {stats.totalPublications}
                </span>
                <span className="text-muted-foreground">Publications</span>
              </div>
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold tabular-nums">
                  {formatCompactNumber(stats.totalCitations)}
                </span>
                <span className="text-muted-foreground">Citations</span>
              </div>
            </div>

            {/* Timeline */}
            <PublicationTimeline
              yearlyDistribution={stats.yearlyDistribution}
              yearRange={stats.yearRange}
            />
          </section>

          <Separator className="my-8" />
        </>
      )}

      {/* Bio Section */}
      {(member.bio || member.education) && (
        <>
          <section className="space-y-4">
            {member.education && (
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">{member.education}</p>
              </div>
            )}
            {member.bio && (
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                <p>{member.bio}</p>
              </div>
            )}
          </section>

          <Separator className="my-8" />
        </>
      )}

      {/* Research Areas */}
      {member.researchAreas.length > 0 && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Research Areas</h2>
            <div className="flex flex-wrap gap-2">
              {member.researchAreas.map(({ researchArea }) => (
                <Link
                  key={researchArea.id}
                  href={`/research/${researchArea.slug}`}
                  className="group"
                >
                  <Badge
                    variant="outline"
                    className="transition-colors group-hover:border-primary group-hover:bg-primary/10"
                  >
                    {researchArea.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>

          <Separator className="my-8" />
        </>
      )}

      {/* Publications */}
      {publications.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Publications</h2>

          <div className="space-y-8">
            {Object.entries(publicationsByYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, pubs]) => (
                <div key={year}>
                  {/* Year Header */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {year}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {pubs.length} paper{pubs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Publication List */}
                  <div className="space-y-3">
                    {pubs.map((pub) => (
                      <PublicationCard key={pub.doi} publication={pub} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function groupPublicationsByYear(
  publications: Awaited<ReturnType<typeof getMemberPublications>>
): Record<string, typeof publications> {
  return publications.reduce(
    (acc, pub) => {
      const year = new Date(pub.date).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(pub);
      return acc;
    },
    {} as Record<string, typeof publications>
  );
}
