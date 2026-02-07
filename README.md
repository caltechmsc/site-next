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

- Server-rendered pages with ISR (5-minute revalidation)
- Dynamic sitemap + robots.txt
- SEO metadata with Open Graph / Twitter cards
- Dark mode
- Responsive design
- Interactive collaborator map (Leaflet)
- Publication filtering by year, journal, research area, member
- Citation export (APA, MLA, Chicago, BibTeX)

### Admin Panel

- JWT auth with access/refresh tokens (HttpOnly cookies)
- Google OAuth + password login
- Full CRUD for all entities via Server Actions
- Drag-and-drop ordering (dnd-kit)
- Image upload with crop + compression (Sharp)
- DOI-based publication sync (CrossRef + OpenAlex)
- Automatic member–publication matching via name aliases
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
