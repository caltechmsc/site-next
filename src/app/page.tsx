/**
 * Home Page (Placeholder)
 */

import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{siteConfig.name}</h1>
      <p className="mt-4 text-muted-foreground">{siteConfig.fullName}</p>
      <p className="mt-2 text-sm text-muted-foreground">v2 - Coming Soon</p>
    </main>
  );
}
