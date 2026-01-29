/**
 * Metadata Utilities
 *
 * Helper functions for generating consistent metadata across pages.
 */

import type { Metadata } from "next";
import { siteConfig, seoDefaults } from "@/config/site";

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
export function createPageMetadata(
  options: PageMetadataOptions = {}
): Metadata {
  const {
    title,
    description = siteConfig.description,
    path = "",
    image = siteConfig.ogImage,
    noIndex = false,
  } = options;

  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : seoDefaults.defaultTitle;

  const url = `${siteConfig.url}${path}`;

  return {
    title: fullTitle,
    description,
    ...(noIndex && { robots: "noindex,nofollow" }),
    openGraph: {
      ...seoDefaults.openGraph,
      title: fullTitle,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      ...seoDefaults.twitter,
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: url,
    },
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
  const title = member.name;
  const description =
    member.bio?.slice(0, 160) ||
    `${member.name}${member.position ? ` - ${member.position}` : ""} at ${siteConfig.fullName}, Caltech.`;

  return createPageMetadata({
    title,
    description,
    path: `/members/${member.id}`,
    image: member.photo || siteConfig.ogImage,
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
  wag: `Prof. William A. Goddard III, Director of ${siteConfig.fullName} at Caltech.`,
  msc: `About ${siteConfig.fullName} at the California Institute of Technology.`,
} as const;
