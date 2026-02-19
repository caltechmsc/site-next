/**
 * Metadata Utilities
 *
 * Helper functions for generating consistent metadata across pages.
 */

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { truncateAtWordBoundary } from "@/lib/format";
import { getYear } from "@/lib/date";

// ============================================================================
// Page Metadata Builders
// ============================================================================

interface PageMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Generate metadata for a page.
 */
export function createPageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
}: PageMetadataOptions = {}): Metadata {
  const ogTitle = title ? `${title} | ${siteConfig.name}` : undefined;
  const url = path !== undefined ? `${siteConfig.url}${path}` : undefined;
  const hasContent = !!(ogTitle || description);
  const resolvedImage = image ?? siteConfig.images.ogImage;

  return {
    ...(title && { title }),
    ...(description && { description }),
    ...(noIndex && { robots: "noindex,nofollow" }),
    ...(hasContent && {
      openGraph: {
        type: "website",
        locale: "en_US",
        siteName: siteConfig.name,
        ...(ogTitle && { title: ogTitle }),
        ...(description && { description }),
        ...(url && { url }),
        images: [{ url: resolvedImage }],
      },
    }),
    ...(hasContent && {
      twitter: {
        card: "summary_large_image",
        ...(ogTitle && { title: ogTitle }),
        ...(description && { description }),
        images: [resolvedImage],
      },
    }),
    ...(url && { alternates: { canonical: url } }),
  };
}

/**
 * Generate metadata for member detail pages.
 */
export function createMemberMetadata(member: {
  id: string;
  name: string;
  position?: string | null;
  bio?: string | null;
  photo?: string | null;
}): Metadata {
  const description = member.bio
    ? truncateAtWordBoundary(member.bio, 160)
    : `${member.name}${member.position ? ` - ${member.position}` : ""} at ${siteConfig.fullName}, Caltech.`;

  return createPageMetadata({
    title: member.name,
    description,
    path: `/members/${member.id}`,
    ...(member.photo && { image: member.photo }),
  });
}

/**
 * Generate metadata for research area detail pages.
 */
export function createResearchAreaMetadata(area: {
  slug: string;
  title: string;
  content?: string | null;
}): Metadata {
  const description = area.content
    ? truncateAtWordBoundary(area.content.replace(/[#*`]/g, ""), 160)
    : `Research on ${area.title} at ${siteConfig.fullName}, Caltech.`;

  return createPageMetadata({
    title: area.title,
    description,
    path: `/research/${area.slug}`,
  });
}

/**
 * Generate metadata for publication detail pages.
 */
export function createPublicationMetadata(publication: {
  index: number;
  doi?: string | null;
  title: string;
  authors: string;
  abstract?: string | null;
  journal?: string | null;
  date: string;
}): Metadata {
  const year = getYear(publication.date);
  const description = publication.abstract
    ? truncateAtWordBoundary(publication.abstract, 160)
    : `${publication.title} (${year})${publication.journal ? ` - ${publication.journal}` : ""}`;

  return createPageMetadata({
    title: publication.title,
    description,
    path: `/publications/${publication.index}`,
  });
}

/**
 * Generate metadata for not found pages.
 */
export function createNotFoundMetadata(entityType: string = "Page"): Metadata {
  return createPageMetadata({
    title: `${entityType} Not Found`,
    description: `The ${entityType.toLowerCase()} you are looking for could not be found.`,
    noIndex: true,
  });
}

// ============================================================================
// Common Page Descriptions
// ============================================================================

/**
 * Predefined descriptions for common pages.
 * Maintains consistency across the site.
 */
export const pageDescriptions = {
  members: `Meet the researchers, students, and staff of ${siteConfig.fullName} at Caltech.`,
  publications: `Publications from ${siteConfig.fullName} researchers at Caltech.`,
  research: `Explore research areas at ${siteConfig.fullName}, Caltech.`,
  collaborators: `Global research partners and collaborators of ${siteConfig.fullName}.`,
  events: `Events, group photos, and calendar for ${siteConfig.fullName}.`,
  photos: `Photo gallery of ${siteConfig.fullName} team through the years.`,
  calendar: `Upcoming events, seminars, and meetings at ${siteConfig.fullName}.`,
  wag: `Prof. William A. Goddard III, Director of ${siteConfig.fullName} at Caltech.`,
  msc: `About ${siteConfig.fullName} at the California Institute of Technology.`,
} as const;
