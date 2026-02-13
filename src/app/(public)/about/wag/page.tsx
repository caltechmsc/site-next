import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Mail,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Award,
  Beaker,
  Atom,
  Sparkles,
} from "lucide-react";

import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/client";
import { formatCompactNumber } from "@/lib/format";
import { PhotoCollage } from "./_components";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "William A. Goddard III",
  description: pageDescriptions.wag,
  path: "/about/wag",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Data Fetching
// ============================================================================

async function getWagStats() {
  try {
    const [publicationCount, totalCitations] = await Promise.all([
      prisma.publication.count(),
      prisma.publication.aggregate({ _sum: { citations: true } }),
    ]);

    return {
      publications: publicationCount,
      citations: totalCitations._sum.citations ?? 0,
    };
  } catch {
    return { publications: 0, citations: 0 };
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function WagPage() {
  const stats = await getWagStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Profile Header */}
      <section className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Photo Collage */}
        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:w-[45%] lg:max-w-none lg:flex-shrink-0">
          <PhotoCollage />
        </div>

        {/* Info */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-2xl font-bold sm:text-3xl">
            William A. Goddard III
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Charles and Mary Ferkel Professor of Chemistry, Materials Science,
            and Applied Physics
          </p>
          <p className="mt-1 text-muted-foreground">
            Director,{" "}
            <Link
              href="/about/msc"
              className="hover:text-primary hover:underline"
            >
              Materials and Process Simulation Center
            </Link>
          </p>
          <p className="text-muted-foreground">
            California Institute of Technology
          </p>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 lg:justify-start">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">
                {formatCompactNumber(stats.publications)}
              </p>
              <p className="text-xs text-muted-foreground">Publications</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">
                {formatCompactNumber(stats.citations)}
              </p>
              <p className="text-xs text-muted-foreground">Citations</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums">1964</p>
              <p className="text-xs text-muted-foreground">Joined Caltech</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild>
              <a href="/files/wag/wag-cv.pdf" download>
                <Download className="mr-2 h-4 w-4" />
                Download CV
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:wag@caltech.edu">
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Research Overview */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Beaker className="h-5 w-5 text-primary" />
          Research Vision
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            The research conducted by the Goddard and MSC teams has consistently
            focused on developing methods that are:
          </p>
          <ol className="ml-4 list-inside list-decimal space-y-2">
            <li>
              <span className="font-medium text-foreground">
                Sufficiently accurate
              </span>{" "}
              — Aimed at minimizing the need for experimental validation,
              restricting it only to the most promising systems predicted by the
              methods.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Sufficiently efficient
              </span>{" "}
              — Designed for application to realistic models of systems
              containing millions of atoms, a field now referred to as{" "}
              <span className="font-medium text-foreground">
                materials genomics
              </span>
              .
            </li>
          </ol>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Key Developments */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Key Developments
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <MethodCard
            title="Quantum Mechanics Methods"
            icon={Atom}
            methods={[
              {
                name: "X3LYP",
                citations: "934",
                description:
                  "Improving accuracy for van der Waals interactions and band gaps",
              },
              {
                name: "GVB",
                description:
                  "Generalized Valence Bond for chemical bonding principles",
              },
            ]}
          />

          <MethodCard
            title="Force Fields"
            icon={Beaker}
            methods={[
              {
                name: "DREIDING",
                citations: "6,718",
                description: "Generic force field for nonmetallic systems",
              },
              {
                name: "UFF",
                citations: "9,699",
                description:
                  "Universal Force Field for the entire periodic table",
              },
            ]}
          />

          <MethodCard
            title="Reactive Force Fields"
            icon={Sparkles}
            methods={[
              {
                name: "ReaxFF",
                citations: "5,159",
                description:
                  "QM-accurate large-scale chemical reactions with millions of atoms",
              },
              {
                name: "RexPoN",
                description: "Next-generation reactive force field",
              },
            ]}
          />

          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-primary" />
                Multiscale Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Hierarchical approaches coupling{" "}
                <span className="font-medium text-foreground">
                  electronic states of QM
                </span>{" "}
                with{" "}
                <span className="font-medium text-foreground">
                  molecular dynamics of macroscale reactive systems
                </span>
                , enabling first-principles accuracy for realistic systems
                handling millions of atoms and nanosecond time scales.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Book Section */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          Featured Publication
        </h2>

        <Card className="mt-6">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="relative mx-auto h-64 w-44 overflow-hidden rounded-lg border bg-muted shadow-md sm:mx-0">
                <Image
                  src="/images/wag/book-cover.png"
                  alt="Computational Materials, Chemistry, and Biochemistry book cover"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">
                Springer Series in Materials Science, Vol. 284
              </Badge>
              <h3 className="text-lg font-semibold leading-snug">
                Computational Materials, Chemistry, and Biochemistry: From Bold
                Initiatives to the Last Mile
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Published 2021 • Downloaded over 108,000 times
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Based on talks at symposia honoring William A. Goddard&apos;s
                contributions to science and engineering. This volume includes
                approximately <span className="font-medium">40 chapters</span>{" "}
                contributed by current and former collaborators, graduate
                students, and postdocs, along with{" "}
                <span className="font-medium">29 chapters</span> written by
                Goddard covering:
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Methods Development",
                  "Surfaces & Interfaces",
                  "Catalysis",
                  "Polymers",
                  "Biosystems",
                  "Pharmaceutical Research",
                ].map((topic) => (
                  <Badge key={topic} variant="outline">
                    {topic}
                  </Badge>
                ))}
              </div>

              <div className="mt-6">
                <Button asChild>
                  <a
                    href="https://link.springer.com/book/10.1007/978-3-030-18778-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Springer
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table of Contents */}
        <details className="group mt-4">
          <summary className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            View Table of Contents (69 Chapters)
          </summary>
          <div className="mt-2 rounded-lg border bg-card p-4">
            <p className="mb-4 text-xs text-muted-foreground">
              Chapters 1–4: Tributes • Chapters 5–40: Contributed by
              collaborators • Chapters 41–69: Written by W. A. Goddard III
            </p>
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <TableOfContentsSection
                title="Part I: Methods"
                chapters={[
                  "Beyond Molecular Orbital Theory (GVB)",
                  "ReaxFF for Biological Systems",
                  "Machine Learning for DFT",
                  "Accelerated MD Methods",
                ]}
              />
              <TableOfContentsSection
                title="Part II: Materials & Nano"
                chapters={[
                  "Nanoelectronics",
                  "Dendrimers",
                  "Thermal Transport",
                  "DNA-Guided CNT Assembly",
                ]}
              />
              <TableOfContentsSection
                title="Part III: Chemistry"
                chapters={[
                  "HER Catalysts",
                  "Selective Oxidation",
                  "CO₂ Conversion",
                  "C–H Activation",
                ]}
              />
              <TableOfContentsSection
                title="Part IV: Biology"
                chapters={[
                  "Biomarkers for Cerebrovascular",
                  "Olfactory Receptors",
                  "F1-ATPase Motor",
                  "Dendritic Imaging",
                ]}
              />
              <TableOfContentsSection
                title="Part V: Methods (WAG)"
                chapters={[
                  "GVB Bonding & Reactions",
                  "Ab Initio Pseudopotentials",
                  "Force Fields & MD",
                  "ReaxFF, RexPoN",
                ]}
              />
              <TableOfContentsSection
                title="Part VI: Materials (WAG)"
                chapters={[
                  "Surface Science",
                  "Nanotechnology",
                  "Metals & Ceramics",
                  "Solar Cells & Batteries",
                ]}
              />
              <TableOfContentsSection
                title="Part VII: Catalysis (WAG)"
                chapters={[
                  "Homogeneous Catalysis",
                  "Heterogeneous Catalysis",
                  "Fuel Cells Electrocatalysis",
                  "CO₂ Reduction",
                ]}
              />
              <TableOfContentsSection
                title="Part VIII: Biology (WAG)"
                chapters={[
                  "Polymers & Dendrimers",
                  "GPCR Structure Prediction",
                  "Protein & Ligand Binding",
                  "DNA & RNA",
                ]}
              />
            </div>
          </div>
        </details>
      </section>

      <Separator className="my-10" />

      {/* Quick Links */}
      <section className="flex flex-wrap justify-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/publications">View All Publications</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/about/msc">About MSC</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/members">Meet the Team</Link>
        </Button>
      </section>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface MethodCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  methods: Array<{
    name: string;
    citations?: string;
    description: string;
  }>;
}

function MethodCard({ title, icon: Icon, methods }: MethodCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.map((method) => (
          <div key={method.name}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{method.name}</span>
              {method.citations && (
                <Badge variant="secondary" className="text-xs">
                  {method.citations} citations
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {method.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface TableOfContentsSectionProps {
  title: string;
  chapters: string[];
}

function TableOfContentsSection({
  title,
  chapters,
}: TableOfContentsSectionProps) {
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {chapters.map((chapter, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-xs text-primary">•</span>
            {chapter}
          </li>
        ))}
      </ul>
    </div>
  );
}
