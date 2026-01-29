import { Mail, MapPin, ExternalLink } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Separator } from "@/components/ui/separator";

// ============================================================================
// Footer Component
// ============================================================================

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {siteConfig.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {siteConfig.fullName}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Developing and applying advanced simulation methods to solve
              problems in chemistry, materials science, and biology.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <address className="not-italic">
                  {siteConfig.address.line1}
                  <br />
                  {siteConfig.address.line2}
                  <br />
                  {siteConfig.address.city}, {siteConfig.address.state}{" "}
                  {siteConfig.address.zip}
                </address>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Links
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={siteConfig.links.caltech}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  California Institute of Technology
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>
            © {currentYear} {siteConfig.fullName}. All rights reserved.
          </p>
          <p>
            Part of{" "}
            <a
              href={siteConfig.links.caltech}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-primary"
            >
              Caltech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
