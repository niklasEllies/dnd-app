# Campaign Memory

The living memory of your tabletop campaign — recaps, quotes, and the moments
your party hasn't discovered yet. **Not a worldbuilding wiki.** See
[`requirements.md`](./requirements.md) for the full product spec and
[`CLAUDE.md`](./CLAUDE.md) for the architecture.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Supabase** — Postgres + Auth + Row-Level Security + Storage
- **Tailwind v4** + **shadcn/ui** (dark / angular / minimal, sage accent)
- Deploy target: **Vercel**

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable                               | Where to find it                        |
| -------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API keys (publishable, `sb_publishable_…`) |

The publishable key is safe to expose to the browser — **Row-Level Security**
enforces all access.

### Supabase auth configuration (one-time)

Authentication uses passwordless **magic links**. In the Supabase dashboard
(Authentication → URL Configuration) set these so the callback works in dev and
production:

- **Site URL**: `http://localhost:3000` (dev) / your Vercel URL (prod)
- **Redirect URLs**: add `http://localhost:3000/**` and `https://<your-app>.vercel.app/**`

The magic link returns to `/auth/callback`, which exchanges the code for a
session.

## How the data access works

The entire DM-vs-player asymmetry lives in **Postgres RLS**, not in app code.
Content rows carry a `visibility` of `secret` or `shared`; members read shared
rows, the DM reads everything, and a "reveal" is just a DM-only `UPDATE`.
Membership changes (creating a campaign, joining by invite code) go through
`SECURITY DEFINER` RPCs (`create_campaign`, `join_campaign`). Never
re-implement visibility filtering in the application layer — trust RLS.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Database types

TypeScript types for the database live in `src/lib/database.types.ts`.
Regenerate them after a schema change with the Supabase MCP
`generate_typescript_types` tool, or:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```
