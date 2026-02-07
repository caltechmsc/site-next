/**
 * Site Configuration
 *
 * Centralized configuration for site metadata and navigation.
 * All values are type-safe with `as const`.
 */

// ============================================================================
// Site Metadata
// ============================================================================

export const siteConfig = {
  name: "Caltech MSC",
  fullName: "Materials and Process Simulation Center",
  description:
    "The Materials and Process Simulation Center (MSC) at Caltech develops and applies advanced simulation methods to solve problems in chemistry, materials science, and biology.",
  url: "http://localhost:3000", // NOTE: Update for production

  // Images
  images: {
    logo: "/images/logo.svg",
    ogImage: "/images/og-image.jpg",
    heroBackground: "/images/group-photo.jpg",
  },

  // Contact
  email: "wag@caltech.edu",
  address: {
    line1: "California Institute of Technology",
    line2: "1200 E California Blvd, MC 139-74",
    city: "Pasadena",
    state: "CA",
    zip: "91125",
    country: "USA",
  },

  // External links
  links: {
    github: "https://github.com/caltechmsc",
    caltech: "https://www.caltech.edu",
  },

  // Google Calendar embed URL (for events page)
  calendarUrl:
    "https://calendar.google.com/calendar/embed?src=wagoddard3%40gmail.com",
} as const;

// ============================================================================
// Navigation
// ============================================================================

export type NavItem = {
  title: string;
  href: string;
  children?: NavItem[];
};

export const mainNav: NavItem[] = [
  {
    title: "About",
    href: "/about",
    children: [
      { title: "Prof. Goddard", href: "/about/wag" },
      { title: "MSC Center", href: "/about/msc" },
    ],
  },
  { title: "Research", href: "/research" },
  { title: "Publications", href: "/publications" },
  { title: "Members", href: "/members" },
  { title: "Collaborators", href: "/collaborators" },
  {
    title: "Events",
    href: "/events",
    children: [
      { title: "Group Photos", href: "/events/photos" },
      { title: "Calendar", href: "/events/calendar" },
    ],
  },
] as const;

// ============================================================================
// SEO Defaults
// ============================================================================

export const seoDefaults = {
  defaultTitle: `${siteConfig.name} - ${siteConfig.fullName}`,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
  },
} as const;
