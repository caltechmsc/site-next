import type { Metadata } from "next";
import Link from "next/link";
import {
  Building,
  Calendar,
  FlaskConical,
  Target,
  Users,
  Lightbulb,
  ArrowRight,
  Microscope,
  Atom,
  Dna,
  Cpu,
  Factory,
} from "lucide-react";

import { createPageMetadata, pageDescriptions } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/client";
import { formatCompactNumber } from "@/lib/format";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = createPageMetadata({
  title: "About MSC",
  description: pageDescriptions.msc,
  path: "/about/msc",
});

// ============================================================================
// Page Configuration
// ============================================================================

export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// Data Fetching
// ============================================================================

async function getMscStats() {
  try {
    const [publicationCount, memberCount, collaboratorCount, totalCitations] =
      await Promise.all([
        prisma.publication.count(),
        prisma.member.count({ where: { isHidden: false } }),
        prisma.collaborator.count({ where: { isHidden: false } }),
        prisma.publication.aggregate({ _sum: { citations: true } }),
      ]);

    return {
      publications: publicationCount,
      members: memberCount,
      collaborators: collaboratorCount,
      citations: totalCitations._sum.citations ?? 0,
    };
  } catch {
    return { publications: 0, members: 0, collaborators: 0, citations: 0 };
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function MscPage() {
  const stats = await getMscStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <section className="text-center">
        <Badge variant="secondary" className="mb-4">
          Established 1990
        </Badge>
        <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
          Materials and Process Simulation Center
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Developing and applying computational methods to solve fundamental
          problems in chemistry, materials science, and biology at Caltech.
        </p>

        {/* Location */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Building className="h-4 w-4" />
          <span>Beckman Institute, California Institute of Technology</span>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={FlaskConical}
            value={formatCompactNumber(stats.publications)}
            label="Publications"
          />
          <StatCard icon={Users} value={stats.members} label="Members" />
          <StatCard
            icon={Building}
            value={stats.collaborators}
            label="Collaborators"
          />
          <StatCard
            icon={Target}
            value={formatCompactNumber(stats.citations)}
            label="Citations"
          />
        </div>
      </section>

      <Separator className="my-10" />

      {/* Mission */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Target className="h-5 w-5 text-primary" />
          Our Mission
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            The overarching goal of our research has been to develop theoretical
            methods{" "}
            <span className="font-medium text-foreground">
              sufficiently accurate
            </span>{" "}
            that the need for experimental validation can be severely restricted
            to the predicted best systems, and{" "}
            <span className="font-medium text-foreground">
              sufficiently efficient
            </span>{" "}
            that they can be applied to realistic models with millions of atoms.
          </p>
          <p>
            Starting around 1970, this vision anticipated what was later labeled{" "}
            <span className="font-medium text-foreground">
              Materials Genomics
            </span>{" "}
            — but with a key difference: we prioritized developing a{" "}
            <em>mechanistic understanding</em> of reactions at the atomic level,
            then using that mechanism to guide the search for improved
            materials.
          </p>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Timeline */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Calendar className="h-5 w-5 text-primary" />
          Research Evolution
        </h2>

        <div className="mt-6 space-y-6">
          <TimelineItem
            era="1960s–1970s"
            title="Quantum Mechanics Foundations"
            description="Developed mathematical methods (GVB) to enable QM predictions of reactions and catalysis. Applied these to understand chemical bonding principles and explain reaction mechanisms."
            icon={Atom}
          />

          <TimelineItem
            era="1980s"
            title="Multiscale Methods"
            description="Shifted focus to multiscale multiparadigm methods enabling predictions on materials, chemical, and biochemical systems involving millions of atoms at time scales of 100s of nanoseconds while retaining QM accuracy."
            icon={Microscope}
          />

          <TimelineItem
            era="1990"
            title="MSC Established"
            description="Founded the Materials and Process Simulation Center in the Beckman Institute at Caltech to develop and apply new methods for practical predictions on materials, catalysis, and pharma problems."
            icon={Building}
            highlight
          />

          <TimelineItem
            era="1990s–2000s"
            title="Expanding Applications"
            description="Extended work to nanotechnology, polymers, metals, proteins, DNA, superconductivity, electrocatalysis, and membrane proteins."
            icon={Dna}
          />

          <TimelineItem
            era="Present"
            title="Industry Partnerships"
            description="Collaborated with ~50 companies over the years on projects spanning scale inhibitors, corrosion inhibitors, wear resistance films, and GPCR structures for pharmaceutical applications."
            icon={Factory}
          />
        </div>
      </section>

      <Separator className="my-10" />

      {/* Methods */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Cpu className="h-5 w-5 text-primary" />
          Core Methods
        </h2>
        <p className="mt-2 text-muted-foreground">
          Key computational methods developed at MSC
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <MethodCard
            name="GVB"
            fullName="Generalized Valence Bond"
            description="Unbiased orbital-based description of valence bond interactions for QM predictions"
          />
          <MethodCard
            name="ReaxFF"
            fullName="Reactive Force Field"
            description="QM-derived reactive force fields enabling near-first-principles accuracy dynamics"
          />
          <MethodCard
            name="RexPoN"
            fullName="Reactive Potentials"
            description="Next-generation reactive potentials for complex chemical systems"
          />
          <MethodCard
            name="UFF"
            fullName="Universal Force Field"
            description="Rule-based force approach applicable to the entire periodic table"
          />
        </div>
      </section>

      <Separator className="my-10" />

      {/* Philosophy */}
      <section>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Lightbulb className="h-8 w-8 text-primary" />
            <blockquote className="mt-4 text-lg italic text-muted-foreground">
              &ldquo;Our successes were partly based on outstanding chemical
              intuition but mostly due to extremely smart grad students and
              postdocs.&rdquo;
            </blockquote>
            <p className="mt-2 text-sm font-medium">— William A. Goddard III</p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-10" />

      {/* Call to Action */}
      <section className="text-center">
        <h2 className="text-xl font-semibold">Explore More</h2>
        <p className="mt-2 text-muted-foreground">
          Learn about our people, research, and publications
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/about/wag">
              Prof. William A. Goddard III
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/members">Meet Our Team</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/research">Research Areas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/publications">Publications</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
}

function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface TimelineItemProps {
  era: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

function TimelineItem({
  era,
  title,
  description,
  icon: Icon,
  highlight,
}: TimelineItemProps) {
  return (
    <div
      className={`relative flex gap-4 rounded-lg border p-4 transition-colors ${
        highlight
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          highlight ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={highlight ? "default" : "secondary"}>{era}</Badge>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface MethodCardProps {
  name: string;
  fullName: string;
  description: string;
}

function MethodCard({ name, fullName, description }: MethodCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          <span className="text-primary">{name}</span>
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {fullName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
