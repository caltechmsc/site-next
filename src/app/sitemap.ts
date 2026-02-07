/**
 * Dynamic Sitemap
 *
 * Generates a sitemap at /sitemap.xml from static routes and database content.
 */

import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/db/client";

// ============================================================================
// Page Configuration
// ============================================================================

/** Revalidate every 60 minutes (3600 seconds) */
export const revalidate = 3600;

// ============================================================================
// Static Routes
// ============================================================================

const staticRoutes: { path: string; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/about/wag", priority: 0.8 },
  { path: "/about/msc", priority: 0.8 },
  { path: "/research", priority: 0.9 },
  { path: "/publications", priority: 0.9 },
  { path: "/members", priority: 0.8 },
  { path: "/collaborators", priority: 0.7 },
  { path: "/events/photos", priority: 0.6 },
  { path: "/events/calendar", priority: 0.6 },
];

// ============================================================================
// Sitemap Generator
// ============================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Fetch dynamic content in parallel
  const [members, publications, researchAreas] = await Promise.all([
    prisma.member.findMany({
      where: { isHidden: false },
      select: { id: true, updatedAt: true },
    }),
    prisma.publication.findMany({
      select: { index: true, updatedAt: true },
    }),
    prisma.researchArea.findMany({
      where: { isHidden: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  // Dynamic: members
  const memberEntries: MetadataRoute.Sitemap = members.map((member) => ({
    url: `${baseUrl}/members/${member.id}`,
    lastModified: member.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic: publications
  const publicationEntries: MetadataRoute.Sitemap = publications.map((pub) => ({
    url: `${baseUrl}/publications/${pub.index}`,
    lastModified: pub.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Dynamic: research areas
  const researchEntries: MetadataRoute.Sitemap = researchAreas.map((area) => ({
    url: `${baseUrl}/research/${area.slug}`,
    lastModified: area.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...researchEntries,
    ...memberEntries,
    ...publicationEntries,
  ];
}
