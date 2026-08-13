# CS Resource Hub

A centralized, searchable library of academic materials for the KNUST Computer Science Department — replacing scattered WhatsApp file-sharing with one organized, searchable home for slides, notes, past questions, and assignments.

## What this is

Course reps already collect and share materials in per-class WhatsApp groups. That content is hard to search, expires, and is invisible to new students. This platform gives students a permanent, searchable library — organized as **Level → Semester → Course → Resources** — with course reps uploading within their assigned level and department admins managing structure and moderation.

Full product design and rationale: [`docs/CS-Resource-Hub-Design-v1.1.md`](docs/CS-Resource-Hub-Design-v1.1.md).

## Current status

**Frontend and backend are integrated.** `components/SessionProvider.tsx` and `components/LibraryProvider.tsx` talk to the real Auth.js session and the Appendix B API routes under `app/api/` (courses, resources, users, requests, search, auth) — there are no mock/demo providers left in the codebase. Reads are server-scoped by level (`lib/api.ts`); writes are scoped the same way and validated with Zod. First sign-in redirects to `/onboarding` to capture an index number; a student's `level` stays unset (and the UI says so honestly) until a super-admin assigns it from `/admin/users`.

**Not yet complete before a real pilot:**
- Provision the actual production Neon/R2/Resend accounts and set the resulting `.env` values (see Getting Started and [`docs/PRODUCTION-SETUP.md`](docs/PRODUCTION-SETUP.md)) — a dev database still needs to be migrated and seeded per environment.
- Promote the two founder accounts to `SUPER_ADMIN` and assign course-rep level scopes.
- Replace the illustrative seed catalogue (`prisma/seed.ts`) with a department-verified Level 100 course list.
- Confirm magic-link delivery actually reaches `@st.knust.edu.gh` inboxes (KNUST's Zimbra mail server is a known deliverability risk — see design doc §14) with a verified sending domain and SPF/DKIM.
- The API's login rate limiter (`lib/rateLimit.ts`) is in-memory and per-instance — production needs a shared store (Upstash Redis or edge/WAF rate limiting) so limits hold across server instances.

## Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database / ORM:** PostgreSQL (Neon) via Prisma
- **Auth:** Auth.js — email magic-link, restricted to `@st.knust.edu.gh`
- **File storage:** Cloudflare R2 (S3-compatible)
- **Icons:** lucide-react

Full stack rationale and free-tier budget: design doc §7, §11.

## Getting started

```bash
git clone https://github.com/Memuna1Lukman/CS-project.git
cd CS-project
npm install
npx prisma generate
```

Copy `.env.example` to `.env` and fill in real values (from the team's shared vault — never commit `.env`):

```bash
cp .env.example .env
```

- `DATABASE_URL` / `DIRECT_URL` — a Neon Postgres project's **pooled** and **unpooled** connection strings respectively. Prisma migrations run over `DIRECT_URL`; the app queries over the pooled `DATABASE_URL` (`pgbouncer=true&connect_timeout=30` — the timeout matters, Neon free-tier compute can take a few seconds to wake from suspend).
- `NEXTAUTH_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev; the deployed HTTPS URL in production.
- `EMAIL_SERVER_*` / `EMAIL_FROM` — SMTP credentials for the magic-link sender (Resend or Brevo). `EMAIL_FROM`'s domain must be verified (SPF/DKIM) with that provider or sends will bounce/be filtered.
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` — Cloudflare R2 S3-compatible credentials for resource file storage.
- `YOUTUBE_API_KEY` — YouTube Data API v3 key, powers the rep/admin "Suggest videos" review queue on a course page (search.list + videos.list + channels.list). Free tier: ~100 units per suggest run, 10,000 units/day. Optional — leave blank to disable video suggestions; previously-approved videos still display.

For the required service accounts, data ownership decisions, and release sequence, follow [`docs/PRODUCTION-SETUP.md`](docs/PRODUCTION-SETUP.md).

Apply the database schema and seed the course catalogue, then run the dev server:

```bash
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/                  Pages (App Router) and API routes (app/api/*)
components/           Reusable UI components
lib/                  Providers, API client, auth/prisma/storage helpers
prisma/               Schema, migrations, seed script
docs/                 Design doc, UI spec, locked decisions (DECISIONS.md), and other project docs
CLAUDE.md / AGENTS.md Instructions read by AI coding agents on this project
```

## Design system

Look and feel — tokens, theming, component conventions, accessibility rules — is defined in [`docs/UI-SPEC.md`](docs/UI-SPEC.md). All colors are CSS custom properties; no component hardcodes a value.

## Roadmap

See design doc §13–§15 for the phased MVP plan and success criteria. Current phase: provisioning real service accounts, promoting the founders to `SUPER_ADMIN`, and seeding a verified Level 100 catalogue ahead of the single-level pilot. Do not add Version 2 features until the pilot meets its coverage and usage test.

## Contributing

Two-person team; see the team's collaboration guide for branching, PR, and review conventions (small, single-purpose branches; PRs into `main`; no direct pushes to `main` once both contributors are active).

## License

Not yet specified.
