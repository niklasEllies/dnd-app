# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**v1 (all four weeks) is built** and feature-complete against `requirements.md` §3: magic-link auth, campaigns (create / join by invite **link or code**), sessions (DM markdown recaps), quotes (any member), entities (NPC/location/faction cards with the secret→reveal mechanic), a `log_entries` timeline, per-entity private notes, plus a one-click demo campaign. `requirements.md` is the source of truth for scope. The complete schema + RLS is applied to the Supabase project (`rijdpyfrbhjehtrkoeka`) and version-controlled in `supabase/migrations/` (`0002`–`0013`); the reveal/hide mechanic is the `reveal_entity`/`hide_entity` RPCs (flip visibility + write/hide a `reveal` timeline moment atomically). The security model and accepted advisories are documented in `docs/security.md` — read it before touching RLS, the helper functions, or the SECURITY DEFINER grants. What remains is real-world, not code: Vercel deploy, production auth redirect URLs, and a real playtest — the sequencing and the post-v1 feature backlog live in `docs/roadmap.md`, and the long-term product direction (concept assessment + the "chat with your campaign" end-goal) in `docs/concept-and-ai-direction.md`.

## What this app is (and is not)

A **campaign-memory app** for tabletop RPG groups: a living chronicle of *one group's* shared play — recaps, quotes, and tagged moments (reveals, deaths, decisions). It is **deliberately not a worldbuilding wiki** (the anti-Kanka/World Anvil positioning) and is **system-agnostic** — no 5e/character-sheet/dice/map/rules features. When a feature request smells like "encyclopedia" or "system-specific," check it against `requirements.md` §3 ("Raus") before implementing; that exclusion list is intentional and load-bearing for the product thesis.

## Stack (decided, see requirements.md §6)

- **Next.js (App Router)** + **TypeScript**, server actions for mutations
- **Supabase** — Postgres + Auth + Row-Level Security + Storage (entity images)
- **Tailwind + shadcn/ui** (dark / angular / minimal, sage accent)
- **Vercel** for deploy
- Supabase Realtime is **intentionally off** for v1 (async save is enough)

Commands: `npm run dev` (dev server), `npm run build` (production build — also runs the TypeScript type-check), `npm run lint`. There is no test setup yet — confirm one exists before assuming `npm test` works.

**shadcn here uses the Base UI registry (`@base-ui/react`), not Radix.** Compose with the `render` prop, NOT `asChild` — e.g. `<DialogTrigger render={<Button>…</Button>} />`, or put `buttonVariants()` on a `<Link>`. `asChild` will type-error and silently no-op.

## Core architecture: visibility asymmetry lives in the database, not the app code

This is the single most important thing to understand. The product's whole value — DM secrets vs. player view, and the **reveal** moment — is implemented in **Postgres Row-Level Security**, not in `if (isDM)` branches in the app.

- Every content row carries a `visibility` column: `'secret'` | `'shared'` (`text` + `CHECK`, not enums — see §4).
- RLS policies enforce: members read `shared` rows; the DM reads everything; **only the DM writes** canon tables (`entities`, `sessions`, `log_entries`). `quotes` are insertable by any member; `private_notes` are visible only to their author.
- Two `security definer` helper functions, `is_member(campaign_id)` and `is_dm(campaign_id)`, exist to break RLS recursion on `campaign_members`. Use these in policies — do not query `campaign_members` directly inside a policy.
- **A "reveal" is just an UPDATE** the DM is allowed to make: `set visibility = 'shared', revealed_at = now()`. RLS then makes the row appear in the player's view and timeline automatically. There is no second datastore and no branching app logic for DM-vs-player — **the player timeline is a plain `select ... order by created_at`** and RLS does the filtering.

Consequence for any code you write: **never re-implement visibility filtering in the application layer.** If players can see a secret, the bug is in an RLS policy, not in a component. Trust RLS and let it do the asymmetry.

## Data model essentials

UUID primary keys everywhere. `text` + `CHECK` constraints instead of Postgres enums (deliberate — avoids enum-migration pain later; preserve this convention when adding columns). The exact DDL, RLS policies, and helper functions are in `requirements.md` §4 — treat it as the canonical migration source.

Tables and their relationships:
- `profiles` (1:1 with `auth.users`) → `campaigns` (owned by a `dm_id`) → `campaign_members` (role `'dm'`/`'player'`, unique per campaign+user)
- Content scoped to a campaign: `sessions` (recap as markdown), `quotes` (text + speaker), `entities` (NPC/location/faction — *one-line cards, not wiki pages*), `log_entries` (the timeline; type ∈ reveal/death/decision/loot/milestone/note), `private_notes` (author-only)
- `entities` and `log_entries` default `visibility = 'secret'`; `quotes` default `'shared'`.

## Working norms for this repo

- The 4-week plan in `requirements.md` §5 sequences the build (foundation → sessions+quotes → entities+asymmetry → polish). Respect that ordering; the asymmetry/RLS work in week 3 is the differentiator, not a nice-to-have.
- Keep entity cards lightweight (name, summary, optional notes/image/status). Resist growing them into wiki pages.
- When changing the schema, add a numbered file to `supabase/migrations/` AND apply it via the supabase MCP `apply_migration`, then regenerate `src/lib/database.types.ts` (MCP `generate_typescript_types`). Membership mutations go through the `create_campaign`/`join_campaign` RPCs — never write `campaign_members` directly from the app (RLS blocks it by design; the RPCs are the only path).
- Auth is passwordless magic-link. Session refresh + route gating live in `src/proxy.ts` → `src/lib/supabase/middleware.ts` (Next 16 renamed the `middleware` file convention to `proxy`). Server vs browser Supabase clients are `src/lib/supabase/{server,client}.ts`; `server.ts` is async because Next 16's `cookies()` is async.
