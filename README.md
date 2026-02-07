# Caltech MSC Website

The official website for the **Materials and Process Simulation Center (MSC)** at Caltech.

Built with Next.js 15 (App Router), Prisma + SQLite, and Tailwind CSS. Includes a public-facing site and a full-featured admin panel.

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or pnpm/yarn)

### Setup

```bash
git clone https://github.com/caltechmsc/site-next.git && cd site-next
npm install
```

Copy the example environment file and fill in the values:

```bash
cp .env.example .env
```

Required variables:

| Variable               | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`         | SQLite path (default: `file:./dev.db`)                                   |
| `JWT_SECRET`           | ≥32 char secret for JWT signing. Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID (for admin login)                                 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                               |

Optional:

| Variable           | Description                                    |
| ------------------ | ---------------------------------------------- |
| `OPENALEX_API_KEY` | OpenAlex API key for publication metadata sync |

### Database

```bash
npx prisma db push    # Create/sync schema
npm run db:seed       # Seed with sample data (development)
```

### Development

```bash
npm run dev           # Start dev server with Turbopack
```

Open [http://localhost:3000](http://localhost:3000). Admin panel is at `/admin`.

Default admin credentials from seed: `admin@example.com` / `admin`.

### Production Build

```bash
npm run build
npm start
```

> **Note:** Update `siteConfig.url` in `src/config/site.ts` to your production domain before deploying.

## Key Features

### Public Site

- Server-rendered with ISR (5-min revalidation), dynamic sitemap, robots.txt
- SEO metadata (Open Graph / Twitter cards) on all pages
- Dark mode, responsive design
- Publication filtering (year, journal, research area, member) and citation export (APA, MLA, BibTeX)
- Hierarchical research area browser with aggregated stats
- Interactive collaborator world map (Leaflet)
- Photo gallery with lightbox, grouped by year
- Embedded Google Calendar

### Admin Panel

- **Auth**: JWT access/refresh tokens (HttpOnly cookies), Google OAuth + password login, role-based access (admin / editor)
- **Content**: Full CRUD for members, publications, research areas, collaborators, group photos, member categories, and admin accounts
- **Ordering**: Drag-and-drop sort (dnd-kit) for members, categories, research areas, collaborators, photos
- **Images**: Upload with crop + server-side compression (Sharp)
- **Publication sync** (manual, from `/admin/sync`):
  - DOI lookup via OpenAlex → CrossRef fallback (fetches title, authors, abstract, journal, etc.)
  - Bulk metadata sync: updates citation counts, topics/keywords from OpenAlex
  - Relationship rebuild: atomically re-derives all member↔publication, publication↔area, and member↔area links using ORCID matching, name alias matching, fuzzy first-initial matching, and keyword intersection
  - Real-time progress streaming (SSE)
- Dashboard with aggregate stats (Recharts)
- Markdown editor for research area content

## Scripts

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Development server (Turbopack) |
| `npm run build`     | Production build               |
| `npm start`         | Start production server        |
| `npm run lint`      | ESLint                         |
| `npm run format`    | Prettier                       |
| `npm run db:push`   | Push schema to database        |
| `npm run db:seed`   | Seed database                  |
| `npm run db:studio` | Open Prisma Studio             |
| `npm run db:reset`  | Reset database + re-seed       |

## Tech Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Framework   | Next.js 15 (App Router, Turbopack, Server Actions) |
| Language    | TypeScript (strict)                                |
| Database    | SQLite + Prisma ORM                                |
| Styling     | Tailwind CSS + shadcn/ui (Radix primitives)        |
| Auth        | JWT (jose) + Google OAuth + bcryptjs               |
| Forms       | React Hook Form + Zod                              |
| Maps        | Leaflet                                            |
| Charts      | Recharts                                           |
| Images      | Sharp (server-side processing)                     |
| Drag & Drop | dnd-kit                                            |

## License

[MIT](LICENSE) © 2026 California Institute of Technology, Materials and Process Simulation Center
