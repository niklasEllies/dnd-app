# Campaign Memory

The living memory of your tabletop campaign — recaps, quotes, and the moments your party
hasn't discovered yet. **Not a worldbuilding wiki**, system-agnostic, and built around one
idea: the DM keeps things secret, then *reveals* them onto a shared timeline.

See [`requirements.md`](./requirements.md) for the product spec, [`CLAUDE.md`](./CLAUDE.md)
for architecture, and [`docs/security.md`](./docs/security.md) for the RLS/security model.

## Features (v1)

- **Auth** — passwordless magic link.
- **Campaigns** — create one (you're the DM) or join by **invite link or code**; 1 DM + N players.
- **Sessions** — numbered sessions with a Markdown recap editor (live preview).
- **Quotes** — anyone at the table can pin a line; attach to a session; author/DM can delete.
- **Entities** — NPC / location / faction cards (lightweight, not wiki pages), with status.
- **Secret → Reveal** — cards start secret (DM-only); one click reveals to players and drops
  a moment on the timeline. "Hide again" reverses both.
- **Timeline** — `log_entries` (reveals + DM-logged moments: death/decision/loot/milestone/note),
  each secret or shared.
- **Two views** — players see only shared content + their own private notes (enforced by RLS).
- **Private notes** — per entity, author-only.
- **Demo campaign** — one click seeds a populated example.

## Stack

Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS + Storage) ·
Tailwind v4 + shadcn/ui (Base UI registry; dark/angular/minimal, sage accent) · Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API keys (publishable, `sb_publishable_…`) |

The publishable key is client-safe — Row-Level Security enforces all access.

### Supabase auth configuration (one-time)

Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000` (dev) / your Vercel URL (prod)
- **Redirect URLs**: add `http://localhost:3000/**` and `https://<your-app>.vercel.app/**`

Magic links return to `/auth/callback`, which exchanges the code for a session.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (also type-checks)
npm run lint    # eslint
npm run start   # serve the production build
```

There is no automated test suite yet; RLS is verified via the security review described in
`docs/security.md`.

## Database & migrations

SQL migrations live in [`supabase/migrations/`](./supabase/migrations) (`0002`–`0013`) and
are applied to the Supabase project. After a schema change: add a numbered migration, apply
it, regenerate `src/lib/database.types.ts`, and re-run the Supabase advisors. The DM-vs-player
asymmetry and the reveal mechanic live entirely in RLS + a few `SECURITY DEFINER` RPCs — read
`docs/security.md` before changing any of it.

## Deploy (Vercel)

Push to a Git host, import into Vercel, set the two env vars, and add the production domain to
the Supabase redirect URLs (above). Supabase Realtime is intentionally off for v1.

## Project layout

```
src/app/                 routes (landing, login, /join, /auth, /dashboard, /campaigns/[id]/…)
src/components/          UI + feature components (shadcn ui/ + app components)
src/lib/actions/         server actions (campaigns, sessions, quotes, entities, log, notes, …)
src/lib/supabase/        SSR client factories + session proxy (middleware)
supabase/migrations/     schema + RLS + RPCs
docs/                    security.md, launch-post.md
```
