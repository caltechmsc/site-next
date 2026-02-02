/**
 * Prisma Seed Script
 *
 * Generates comprehensive test data for development.
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================================
// Type Definitions for Seed Data
// ============================================================================

interface MemberCategorySeed {
  name: string;
  order: number;
  showByDefault: boolean;
}

interface MemberSeed {
  name: string;
  aliases: string; // JSON string
  email: string;
  position: string;
  education: string;
  bio: string;
  category: string;
  startDate: string; // ISO date: "YYYY-MM-DD"
  website?: string;
  orcid?: string;
  endDate?: string; // ISO date: "YYYY-MM-DD"
}

interface ResearchAreaSeed {
  slug: string;
  title: string;
  keywords: string; // JSON string
  content: string;
  order: number;
  parent?: string; // Parent slug for child areas
}

interface PublicationSeed {
  doi: string;
  title: string;
  authors: string; // JSON string
  abstract: string;
  date: string; // ISO date: "YYYY-MM-DD"
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  citations: number;
  areas: string[]; // Research area slugs
  memberNames: string[]; // Member names for linking
}

interface CollaboratorSeed {
  organization: string;
  leader: string;
  email: string;
  website: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  order: number;
}

interface GroupPhotoSeed {
  date: string; // ISO date: "YYYY-MM-DD"
  caption: string;
  order: number;
}

interface AdminSeed {
  email: string;
  name: string;
  password: string;
  role: string;
}

// ============================================================================
// Utilities
// ============================================================================

/** Generate avatar URL from name */
const avatar = (name: string, size = 256) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=random&color=fff`;

/** Generate random group photo URL using picsum.photos */
const groupPhoto = (seed: number | string) =>
  `https://picsum.photos/seed/${seed}/1200/800`;

/** Hash password using bcrypt */
const hashPassword = async (password: string) => bcrypt.hash(password, 12);

/** JSON stringify helper */
const json = (arr: string[]) => JSON.stringify(arr);

// ============================================================================
// Seed Data Definitions
// ============================================================================

const CATEGORIES: MemberCategorySeed[] = [
  { name: "Faculty", order: 100, showByDefault: true },
  { name: "Postdoc", order: 200, showByDefault: true },
  { name: "Graduate Student", order: 300, showByDefault: true },
  { name: "Undergraduate Student", order: 400, showByDefault: false },
];

const MEMBERS: MemberSeed[] = [
  {
    name: "William A. Goddard III",
    aliases: json(["W.A. Goddard", "Bill Goddard", "Goddard III"]),
    email: "wag@caltech.edu",
    position: "Charles and Mary Ferkel Professor",
    education: "Ph.D. Caltech, 1965",
    bio: "Director of the Materials and Process Simulation Center. Research focuses on developing new theoretical methods and applying them to materials science.",
    website: "https://www.wag.caltech.edu",
    orcid: "0000-0003-0097-5716",
    category: "Faculty",
    startDate: "1984-01-01",
  },
  {
    name: "John Smith",
    aliases: json(["J. Smith", "John D. Smith"]),
    email: "jsmith@caltech.edu",
    position: "Postdoctoral Scholar",
    education: "Ph.D. MIT, 2022",
    bio: "Research interests in quantum chemistry and machine learning applications.",
    category: "Postdoc",
    startDate: "2023-01-15",
  },
  {
    name: "Jane Doe",
    aliases: json(["J. Doe"]),
    email: "jdoe@caltech.edu",
    position: "Postdoctoral Scholar",
    education: "Ph.D. Stanford, 2021",
    bio: "Specializing in ReaxFF development for reactive systems.",
    category: "Postdoc",
    startDate: "2022-06-01",
  },
  {
    name: "Alex Chen",
    aliases: json(["A. Chen", "陈明"]),
    email: "achen@caltech.edu",
    position: "Graduate Student",
    education: "B.S. Tsinghua University, 2021",
    bio: "Working on machine learning potentials for catalysis.",
    category: "Graduate Student",
    startDate: "2021-09-01",
  },
  {
    name: "Maria Garcia",
    aliases: json(["M. Garcia"]),
    email: "mgarcia@caltech.edu",
    position: "Graduate Student",
    education: "B.S. UC Berkeley, 2022",
    bio: "Developing new methods for energy storage materials.",
    category: "Graduate Student",
    startDate: "2022-09-01",
  },
  {
    name: "Robert Wilson",
    aliases: json(["R. Wilson", "Bob Wilson"]),
    email: "rwilson@example.com",
    position: "Former Undergraduate Student",
    education: "Ph.D. Caltech, 2020",
    bio: "Now at Google Research.",
    website: "https://example.com/rwilson",
    category: "Undergraduate Student",
    startDate: "2015-09-01",
    endDate: "2020-06-15",
  },
];

const RESEARCH_AREAS: ResearchAreaSeed[] = [
  // Parent areas with children
  {
    slug: "methods",
    title: "A. Computational Methods",
    keywords: json(["methods", "theory", "simulation"]),
    content: "Development of new computational methods for materials science.",
    order: 100,
  },
  {
    slug: "applications",
    title: "B. Applications",
    keywords: json(["applications", "materials"]),
    content: "Application of computational methods to real-world problems.",
    order: 200,
  },
  // Standalone area (no parent, no children)
  {
    slug: "machine-learning",
    title: "C. Machine Learning for Materials",
    keywords: json([
      "ML",
      "machine learning",
      "neural network",
      "AI",
      "deep learning",
    ]),
    content: `# Machine Learning for Materials Science

Developing and applying machine learning methods to accelerate materials discovery and simulation.

## Research Focus

- **Neural Network Potentials** - ML-based interatomic potentials for MD simulations
- **Property Prediction** - Predicting material properties from structure
- **Inverse Design** - ML-guided discovery of new materials
- **Accelerated Sampling** - Enhanced sampling methods using ML

This is a cross-cutting area that combines with our methods and applications research.`,
    order: 300,
  },
  // Child areas
  {
    slug: "quantum-mechanics",
    title: "A1. Quantum Mechanics",
    keywords: json(["QM", "DFT", "density functional", "ab initio", "quantum"]),
    content: `# Quantum Mechanics Methods

Our group develops and applies quantum mechanics methods including:

- **Density Functional Theory (DFT)** - For accurate electronic structure
- **QM/MM Methods** - Hybrid quantum/classical approaches
- **Grand Canonical QM** - For electrochemical systems

## Key Publications

See the publications linked below for our latest work in this area.`,
    parent: "methods",
    order: 110,
  },
  {
    slug: "reaxff",
    title: "A2. ReaxFF Reactive Force Field",
    keywords: json(["ReaxFF", "reactive", "force field", "molecular dynamics"]),
    content: `# ReaxFF Reactive Force Field

ReaxFF is a reactive force field developed in our group that enables:

- Reactive molecular dynamics simulations
- Bond breaking and formation
- Large-scale simulations (millions of atoms)`,
    parent: "methods",
    order: 120,
  },
  {
    slug: "catalysis",
    title: "B1. Catalysis",
    keywords: json([
      "catalysis",
      "catalyst",
      "reaction",
      "mechanism",
      "surface",
    ]),
    content: `# Catalysis Research

We apply computational methods to understand catalytic mechanisms and design new catalysts.`,
    parent: "applications",
    order: 210,
  },
  {
    slug: "energy-materials",
    title: "B2. Energy Materials",
    keywords: json([
      "battery",
      "fuel cell",
      "solar",
      "energy storage",
      "lithium",
    ]),
    content: `# Energy Materials

Research on materials for energy storage and conversion, including batteries and fuel cells.`,
    parent: "applications",
    order: 220,
  },
];

const PUBLICATIONS: PublicationSeed[] = [
  {
    doi: "10.1021/acs.jpclett.5b00001",
    title: "Grand Canonical Electronic DFT for Electrochemical Interfaces",
    authors: json(["W.A. Goddard III", "J. Smith", "A. Chen"]),
    abstract:
      "We present a new grand canonical DFT method for accurate modeling of electrochemical interfaces with proper treatment of electron chemical potential.",
    date: "2025-01-15",
    journal: "J. Phys. Chem. Lett.",
    volume: "16",
    issue: "2",
    pages: "512-518",
    citations: 12,
    areas: ["quantum-mechanics"],
    memberNames: ["William A. Goddard III", "John Smith", "Alex Chen"],
  },
  {
    doi: "10.1021/jacs.4c12345",
    title: "Machine Learning Accelerated ReaxFF for Catalysis",
    authors: json(["J. Smith", "W.A. Goddard III"]),
    abstract:
      "A machine learning approach to accelerate ReaxFF simulations while maintaining accuracy for catalytic systems.",
    date: "2024-11-20",
    journal: "J. Am. Chem. Soc.",
    volume: "146",
    issue: "45",
    pages: "30821-30830",
    citations: 28,
    areas: ["reaxff", "catalysis"],
    memberNames: ["John Smith", "William A. Goddard III"],
  },
  {
    doi: "10.1038/s41563-024-01900-1",
    title: "Rational Design of Solid-State Battery Electrolytes",
    authors: json(["M. Garcia", "W.A. Goddard III"]),
    abstract:
      "Using first-principles calculations to design new solid electrolyte materials for next-generation batteries.",
    date: "2024-08-10",
    journal: "Nat. Mater.",
    volume: "23",
    issue: "8",
    pages: "1045-1052",
    citations: 156,
    areas: ["quantum-mechanics", "energy-materials"],
    memberNames: ["Maria Garcia", "William A. Goddard III"],
  },
  {
    doi: "10.1126/science.abq1234",
    title: "Mechanism of CO2 Reduction on Copper Catalysts",
    authors: json(["A. Chen", "J. Doe", "W.A. Goddard III"]),
    abstract:
      "Elucidating the complete reaction mechanism for electrochemical CO2 reduction using QM/MM simulations.",
    date: "2024-06-15",
    journal: "Science",
    volume: "384",
    issue: "6700",
    pages: "1123-1128",
    citations: 234,
    areas: ["quantum-mechanics", "catalysis"],
    memberNames: ["Alex Chen", "Jane Doe", "William A. Goddard III"],
  },
  {
    doi: "10.1021/acscatal.4c00001",
    title: "ReaxFF Study of Ammonia Synthesis on Iron Catalysts",
    authors: json(["J. Doe", "W.A. Goddard III"]),
    abstract:
      "Molecular dynamics simulations revealing the role of surface defects in Haber-Bosch catalysis.",
    date: "2024-03-01",
    journal: "ACS Catal.",
    volume: "14",
    issue: "5",
    pages: "3456-3467",
    citations: 45,
    areas: ["reaxff", "catalysis"],
    memberNames: ["Jane Doe", "William A. Goddard III"],
  },
  {
    doi: "10.1103/PhysRevLett.132.123456",
    title: "Quantum Coherence Effects in Proton Transfer",
    authors: json(["J. Smith", "A. Chen", "W.A. Goddard III"]),
    abstract:
      "Nuclear quantum effects in proton-coupled electron transfer revealed by path integral simulations.",
    date: "2024-01-22",
    journal: "Phys. Rev. Lett.",
    volume: "132",
    issue: "12",
    pages: "123456",
    citations: 67,
    areas: ["quantum-mechanics"],
    memberNames: ["John Smith", "Alex Chen", "William A. Goddard III"],
  },
  {
    doi: "10.1021/acs.nanolett.3c04567",
    title: "Lithium Dendrite Formation: An Atomistic View",
    authors: json(["M. Garcia", "R. Wilson", "W.A. Goddard III"]),
    abstract:
      "ReaxFF simulations provide atomistic insights into lithium metal anode degradation mechanisms.",
    date: "2023-09-15",
    journal: "Nano Lett.",
    volume: "23",
    issue: "18",
    pages: "8234-8241",
    citations: 89,
    areas: ["reaxff", "energy-materials"],
    memberNames: ["Maria Garcia", "Robert Wilson", "William A. Goddard III"],
  },
  {
    doi: "10.1002/anie.202312345",
    title: "Single-Atom Catalysts for Water Splitting",
    authors: json(["A. Chen", "W.A. Goddard III"]),
    abstract:
      "DFT screening identifies optimal single-atom catalysts for efficient water electrolysis.",
    date: "2023-07-01",
    journal: "Angew. Chem. Int. Ed.",
    volume: "62",
    issue: "28",
    pages: "e202312345",
    citations: 112,
    areas: ["quantum-mechanics", "catalysis", "energy-materials"],
    memberNames: ["Alex Chen", "William A. Goddard III"],
  },
  {
    doi: "10.1021/acs.jpcc.3c00789",
    title: "ReaxFF Parameters for Perovskite Solar Cells",
    authors: json(["J. Doe", "M. Garcia", "W.A. Goddard III"]),
    abstract:
      "Development and validation of ReaxFF parameters for hybrid organic-inorganic perovskites.",
    date: "2023-04-20",
    journal: "J. Phys. Chem. C",
    volume: "127",
    issue: "16",
    pages: "7890-7901",
    citations: 34,
    areas: ["reaxff", "energy-materials"],
    memberNames: ["Jane Doe", "Maria Garcia", "William A. Goddard III"],
  },
  {
    doi: "10.1038/s42256-024-00850-0",
    title: "Neural Network Potentials for Reactive Molecular Dynamics",
    authors: json(["A. Chen", "J. Smith", "W.A. Goddard III"]),
    abstract:
      "A unified framework combining graph neural networks with ReaxFF for accurate and efficient reactive simulations.",
    date: "2024-05-15",
    journal: "Nat. Mach. Intell.",
    volume: "6",
    issue: "5",
    pages: "512-523",
    citations: 45,
    areas: ["machine-learning", "reaxff"],
    memberNames: ["Alex Chen", "John Smith", "William A. Goddard III"],
  },
  {
    doi: "10.1021/acs.jctc.3c01234",
    title: "Deep Learning for Predicting Catalyst Activity",
    authors: json(["M. Garcia", "A. Chen", "W.A. Goddard III"]),
    abstract:
      "Machine learning models trained on DFT data predict catalytic activity with chemical accuracy.",
    date: "2024-02-20",
    journal: "J. Chem. Theory Comput.",
    volume: "20",
    issue: "4",
    pages: "1890-1902",
    citations: 23,
    areas: ["machine-learning", "catalysis"],
    memberNames: ["Maria Garcia", "Alex Chen", "William A. Goddard III"],
  },
  {
    doi: "10.1038/s41929-022-00890-w",
    title: "Theory-Guided Catalyst Design for Selective Oxidation",
    authors: json(["R. Wilson", "W.A. Goddard III"]),
    abstract:
      "A computational framework for rational design of selective oxidation catalysts.",
    date: "2022-12-01",
    journal: "Nat. Catal.",
    volume: "5",
    issue: "12",
    pages: "1089-1098",
    citations: 187,
    areas: ["quantum-mechanics", "catalysis"],
    memberNames: ["Robert Wilson", "William A. Goddard III"],
  },
  {
    doi: "10.1021/acs.chemrev.2c00456",
    title: "ReaxFF: 20 Years of Development and Applications",
    authors: json(["W.A. Goddard III", "J. Doe"]),
    abstract:
      "A comprehensive review of ReaxFF reactive force field methodology and its applications over two decades.",
    date: "2022-08-15",
    journal: "Chem. Rev.",
    volume: "122",
    issue: "16",
    pages: "13456-13520",
    citations: 456,
    areas: ["reaxff"],
    memberNames: ["William A. Goddard III", "Jane Doe"],
  },
  {
    doi: "10.1073/pnas.2112345118",
    title: "Enzyme Catalysis Mechanism from QM/MM Simulations",
    authors: json(["J. Smith", "W.A. Goddard III"]),
    abstract:
      "QM/MM free energy calculations reveal the complete catalytic cycle of cytochrome P450.",
    date: "2022-03-10",
    journal: "Proc. Natl. Acad. Sci. U.S.A.",
    volume: "119",
    issue: "10",
    pages: "e2112345118",
    citations: 78,
    areas: ["quantum-mechanics", "catalysis"],
    memberNames: ["John Smith", "William A. Goddard III"],
  },
];

const COLLABORATORS: CollaboratorSeed[] = [
  {
    organization: "Stanford University",
    leader: "Prof. Jennifer Martinez",
    email: "jmartinez@stanford.edu",
    website: "https://stanford.edu/~jmartinez",
    country: "United States",
    city: "Stanford, CA",
    latitude: 37.4275,
    longitude: -122.1697,
    order: 100,
  },
  {
    organization: "Massachusetts Institute of Technology",
    leader: "Prof. David Lee",
    email: "dlee@mit.edu",
    website: "https://mit.edu/~dlee",
    country: "United States",
    city: "Cambridge, MA",
    latitude: 42.3601,
    longitude: -71.0942,
    order: 200,
  },
  {
    organization: "University of Cambridge",
    leader: "Prof. Emma Thompson",
    email: "et456@cam.ac.uk",
    website: "https://www.ch.cam.ac.uk/person/et456",
    country: "United Kingdom",
    city: "Cambridge",
    latitude: 52.2053,
    longitude: 0.1218,
    order: 300,
  },
  {
    organization: "Tsinghua University",
    leader: "Prof. Wei Zhang",
    email: "wzhang@tsinghua.edu.cn",
    website: "https://www.tsinghua.edu.cn/~wzhang",
    country: "China",
    city: "Beijing",
    latitude: 39.9042,
    longitude: 116.4074,
    order: 400,
  },
];

// Generate 1000 group photos across years
const GROUP_PHOTOS: GroupPhotoSeed[] = (() => {
  const events = [
    "New Year Celebration",
    "Spring Retreat",
    "Summer BBQ",
    "Fall Workshop",
    "Holiday Party",
    "Group Meeting",
    "Lab Tour",
    "Conference Trip",
    "Team Building",
    "Research Symposium",
    "Welcome Event",
    "Farewell Party",
    "Anniversary Celebration",
    "Outdoor Excursion",
    "Award Ceremony",
  ];

  const photos: GroupPhotoSeed[] = [];

  for (let year = 2000; year <= 2025; year++) {
    // ~40 photos per year to reach 1000+
    const photosThisYear = 35 + Math.floor(Math.random() * 10);
    for (let i = 0; i < photosThisYear && photos.length < 1000; i++) {
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const event = events[Math.floor(Math.random() * events.length)];

      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      photos.push({
        date: dateStr,
        caption: `MSC ${event} ${year}`,
        order: photos.length * 10,
      });
    }
  }

  return photos;
})();

const DEFAULT_ADMIN: AdminSeed = {
  email: "admin@msc.caltech.edu",
  name: "Admin",
  password: "admin", // Will be hashed
  role: "admin",
};

// ============================================================================
// Seed Functions
// ============================================================================

async function seedCategories() {
  console.log("📁 Seeding member categories...");

  const categories = await Promise.all(
    CATEGORIES.map((cat) =>
      prisma.memberCategory.create({
        data: {
          name: cat.name,
          order: cat.order,
          showByDefault: cat.showByDefault,
        },
      })
    )
  );

  return Object.fromEntries(categories.map((c) => [c.name, c.id]));
}

async function seedMembers(categoryIds: Record<string, string>) {
  console.log("👥 Seeding members...");

  const members = await Promise.all(
    MEMBERS.map((member, index) =>
      prisma.member.create({
        data: {
          name: member.name,
          aliases: member.aliases,
          email: member.email,
          photo: avatar(member.name),
          website: member.website ?? null,
          position: member.position,
          education: member.education,
          bio: member.bio,
          orcid: member.orcid ?? null,
          categoryId: categoryIds[member.category],
          startDate: member.startDate,
          endDate: member.endDate ?? null,
          order: (index + 1) * 100,
        },
      })
    )
  );

  return Object.fromEntries(members.map((m) => [m.name, m.id]));
}

async function seedResearchAreas() {
  console.log("🔬 Seeding research areas...");

  // First pass: create parent areas (those without parent field)
  const parentAreas = RESEARCH_AREAS.filter((a) => !a.parent);
  const createdParents = await Promise.all(
    parentAreas.map((area) =>
      prisma.researchArea.create({
        data: {
          slug: area.slug,
          title: area.title,
          keywords: area.keywords,
          content: area.content,
          order: area.order,
        },
      })
    )
  );

  const parentIds = Object.fromEntries(
    createdParents.map((p) => [p.slug, p.id])
  );

  // Second pass: create child areas (those with parent field)
  const childAreas = RESEARCH_AREAS.filter(
    (a): a is ResearchAreaSeed & { parent: string } => a.parent !== undefined
  );
  const createdChildren = await Promise.all(
    childAreas.map((area) =>
      prisma.researchArea.create({
        data: {
          slug: area.slug,
          title: area.title,
          keywords: area.keywords,
          content: area.content,
          parentId: parentIds[area.parent],
          order: area.order,
        },
      })
    )
  );

  return Object.fromEntries(
    [...createdParents, ...createdChildren].map((a) => [a.slug, a.id])
  );
}

async function seedPublications(
  memberIds: Record<string, string>,
  areaIds: Record<string, string>
) {
  console.log("📄 Seeding publications...");

  for (const pub of PUBLICATIONS) {
    // Create publication
    await prisma.publication.create({
      data: {
        doi: pub.doi,
        title: pub.title,
        authors: pub.authors,
        abstract: pub.abstract,
        date: pub.date,
        journal: pub.journal,
        volume: pub.volume,
        issue: pub.issue,
        pages: pub.pages,
        citations: pub.citations,
        lastSyncedAt: new Date(),
      },
    });

    // Link to research areas
    for (const areaSlug of pub.areas) {
      if (areaIds[areaSlug]) {
        await prisma.publicationResearchArea.create({
          data: {
            publicationDoi: pub.doi,
            researchAreaId: areaIds[areaSlug],
          },
        });
      }
    }

    // Link to members
    for (const memberName of pub.memberNames) {
      if (memberIds[memberName]) {
        await prisma.memberPublication.create({
          data: {
            memberId: memberIds[memberName],
            publicationDoi: pub.doi,
          },
        });
      }
    }
  }
}

async function seedMemberResearchAreas(
  memberIds: Record<string, string>,
  areaIds: Record<string, string>
) {
  console.log("🔗 Linking members to research areas...");

  // Infer member-area relationships from publications
  const memberAreas: Record<string, Set<string>> = {};

  for (const pub of PUBLICATIONS) {
    for (const memberName of pub.memberNames) {
      if (!memberAreas[memberName]) {
        memberAreas[memberName] = new Set();
      }
      for (const areaSlug of pub.areas) {
        memberAreas[memberName].add(areaSlug);
      }
    }
  }

  // Create relationships
  for (const [memberName, areaSlugs] of Object.entries(memberAreas)) {
    if (!memberIds[memberName]) continue;
    for (const areaSlug of areaSlugs) {
      if (!areaIds[areaSlug]) continue;
      await prisma.memberResearchArea.create({
        data: {
          memberId: memberIds[memberName],
          researchAreaId: areaIds[areaSlug],
        },
      });
    }
  }
}

async function seedCollaborators() {
  console.log("🌍 Seeding collaborators...");

  await Promise.all(
    COLLABORATORS.map((collab) =>
      prisma.collaborator.create({
        data: collab,
      })
    )
  );
}

async function seedGroupPhotos() {
  console.log("📷 Seeding group photos...");

  await Promise.all(
    GROUP_PHOTOS.map((photo, index) =>
      prisma.groupPhoto.create({
        data: {
          date: photo.date,
          imageUrl: groupPhoto(`msc-photo-${index}`),
          caption: photo.caption,
          order: photo.order,
        },
      })
    )
  );
}

async function seedAdmin() {
  console.log("🔐 Seeding admin user...");

  const passwordHash = await hashPassword(DEFAULT_ADMIN.password);

  await prisma.admin.create({
    data: {
      email: DEFAULT_ADMIN.email,
      name: DEFAULT_ADMIN.name,
      passwordHash,
      role: DEFAULT_ADMIN.role,
    },
  });

  console.log(`   ✓ Admin: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n🌱 Starting seed...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.memberPublication.deleteMany();
  await prisma.memberResearchArea.deleteMany();
  await prisma.publicationResearchArea.deleteMany();
  await prisma.member.deleteMany();
  await prisma.memberCategory.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.researchArea.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.groupPhoto.deleteMany();
  await prisma.admin.deleteMany();

  // Seed data
  const categoryIds = await seedCategories();
  const memberIds = await seedMembers(categoryIds);
  const areaIds = await seedResearchAreas();
  await seedPublications(memberIds, areaIds);
  await seedMemberResearchAreas(memberIds, areaIds);
  await seedCollaborators();
  await seedGroupPhotos();
  await seedAdmin();

  // Summary
  console.log("\n✅ Seed completed!\n");
  console.log("   📁 Categories:", Object.keys(categoryIds).length);
  console.log("   👥 Members:", Object.keys(memberIds).length);
  console.log("   🔬 Research Areas:", Object.keys(areaIds).length);
  console.log("   📄 Publications:", PUBLICATIONS.length);
  console.log("   🌍 Collaborators:", COLLABORATORS.length);
  console.log("   📷 Group Photos:", GROUP_PHOTOS.length);
  console.log("   🔐 Admins: 1");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
