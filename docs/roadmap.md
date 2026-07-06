# Roadmap

Status as of **2026-07-06**. `requirements.md` §3 stays the scope authority; this file sequences
what comes *after* v1 code-complete. Rule of thumb inherited from §6: **nothing from Phase 3+
gets built until the north star is hit** (DM logs ≥2 sessions in a row; ≥1 player login between
sessions).

## Where we are

- **v1 is code-complete** against `requirements.md` §3: auth, campaigns + invites, sessions,
  quotes, entities with secret→reveal, timeline, private notes, demo campaign. Schema + RLS
  applied and reviewed (`docs/security.md`).
- **Not yet done:** Vercel deploy, production auth config, a real playtest. The app has never
  been used by an actual group.
- Working tree has an uncommitted landing-page polish pass + `docs/security.md`.

## Phase 0 — Ship it (blocking everything else)

1. ~~Commit the pending landing-page work and `docs/`.~~ ✅ 2026-07-06
2. ~~Push, deploy to Vercel with env vars.~~ ✅ 2026-07-06 — live at
   **https://dnd-app-dun.vercel.app** (project `dnd-app`, GitHub integration deploys `main`
   to production automatically; both env vars set for Preview + Production).
3. Supabase → Auth → URL Configuration: set Site URL to `https://dnd-app-dun.vercel.app`,
   add `https://dnd-app-dun.vercel.app/**` to redirect URLs. (Dashboard-only — no API for this.)
4. **Custom SMTP before inviting anyone.** Supabase's built-in mailer is rate-limited to a
   handful of emails/hour — magic-link auth for a 5-person table will hit it immediately.
   Wire up Resend (or similar) in Supabase → Auth → SMTP.
5. Prod smoke test with two real accounts: create campaign → join by link → recap → quote →
   secret entity → reveal → player sees it. On a phone, too.

**Done when:** the full core loop works on the production URL from two devices.

## Phase 1 — Validate (real humans, no new features)

1. **Own table plays a real session** with it (the "dark launch" in `docs/launch-post.md`).
2. Fix the top jank from that session — bugs and friction only, no scope.
3. Post the recruitment text (`docs/launch-post.md`) to get 3–5 external DMs.
4. Track the north star cheaply: a weekly manual SQL check of sessions-per-campaign and
   player logins is enough. No analytics stack.

**Done when:** north star hit or clearly missed — either way we learn what to build next.

## Phase 2 — v1.x quality of life (thesis-aligned, order by playtest feedback)

These are candidates, not commitments; let the playtest reorder them.

- **Cards as lenses (mini-timeline per card)** — the entity page shows nothing that
  *happened* to the entity; render its `log_entries` (and quotes) as a per-card timeline.
  Cheap (one query, RLS filters per viewer) and arguably a v1 gap. See
  `docs/concept-and-ai-direction.md`.
- **Recap-posted notification** — email to members when a recap or reveal lands. Directly
  drives the "player logs in between sessions" half of the north star. Probably the highest-
  leverage single feature in this list.
- **Recap-writing assistant (first AI feature)** — bullet points in → recap draft +
  suggested moments/cards out. Attacks logging fatigue, the loop's existential risk, and
  feeds the corpus the Phase 3 chat consumes. Rationale in `docs/concept-and-ai-direction.md`.
- **Entity images** — `image_url` + storage bucket + RLS already exist; only the upload UI is
  missing. When building it, close the documented residual risk (random filenames or a
  `can_read_entity_image()` check — see `docs/security.md` → Residual risks).
- **`sessions.visibility`** — lets the DM draft a recap privately and publish it (also closes
  the second residual risk). Reuse the existing reveal pattern.
- **Member management** — DM removes a member, regenerates the invite code; a player leaves a
  campaign. All RPC-shaped, same pattern as `join_campaign`.
- **Profile editing** — display name / avatar after signup; account deletion.
- **Quote speaker suggestions** — offer `character_name`s from the roster instead of free
  text; keeps quotes attributable without adding structure.
- **In-campaign search** — was cut from v1 ("beyond the minimum"); revisit once a campaign
  has 10+ sessions and scrolling hurts.
- **RLS regression tests** — before the *next* schema change: script the empirical
  simulations from `docs/security.md` (member-reads-secret → 0 rows, etc.) so they're
  re-runnable instead of one-off.

## Phase 3 — v1.5 differentiators (locked behind the north star)

- **"Chat with your campaign" (the headline — Niklas's stated end-goal)** — DM asks the
  chronicle questions; answers are visibility-aware because retrieval runs through the
  user's RLS-scoped client ("what does the party *know* about X?"). No RAG needed for v1 —
  a campaign fits in one context window. Natural paid tier. Full design rationale and
  data-model prerequisites: `docs/concept-and-ai-direction.md`.
- **Relationship graph viz** (explicitly deferred in §3) — the "remember when" map of who
  betrayed whom. Wants the same entity-mention substrate as chat — one investment, two
  features.
- **"Campaign book" export** — the finished chronicle as a printable/PDF document at
  campaign end. Emotional payoff feature and the most natural future paid hook.
- **Supabase Realtime** — live quote feed during play, if tables actually use it mid-session.
- **Between-session resurfacing** — "one year ago your party…" digest; retention play.

## Explicitly still out (the §3 "Raus" list holds)

Character sheets / dice / maps / anything system-specific; worldbuilding-wiki depth on
entity cards; public publishing; native apps; payment before the hook is proven. When a
feature request smells like an encyclopedia, it's a no.
