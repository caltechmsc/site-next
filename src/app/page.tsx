/**
 * Home Page (Placeholder)
 */

import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      {/* Theme Toggle (top right) */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">{siteConfig.name}</h1>
        <p className="mt-2 text-muted-foreground">{siteConfig.fullName}</p>
        <Badge variant="secondary" className="mt-4">
          v2 - In Development
        </Badge>
      </div>

      {/* Component Preview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Theme System</CardTitle>
            <CardDescription>
              Click the icon in the top right to switch themes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caltech Colors</CardTitle>
            <CardDescription>Orange primary, Teal secondary</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
