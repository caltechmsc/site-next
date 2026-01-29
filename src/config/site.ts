/**
 * Site Configuration
 *
 * Centralized configuration for site metadata, navigation, and features.
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
  url: "https://msc.caltech.edu",
  ogImage: "/images/og-image.png",

  // Contact
  email: "msc@caltech.edu",
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
  calendarUrl: "",
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

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin" },
  { title: "Publications", href: "/admin/publications" },
  { title: "Members", href: "/admin/members" },
  { title: "Research", href: "/admin/research" },
  { title: "Collaborators", href: "/admin/collaborators" },
  { title: "Photos", href: "/admin/photos" },
  { title: "Settings", href: "/admin/settings" },
] as const;
