# Concept analysis & AI direction ("chat with your campaign")

Written 2026-07-06 after a working session. **Audience: Niklas on another machine, or a
fresh agent picking this up.** Read `CLAUDE.md` → `docs/roadmap.md` → this file, in that
order. The end-goal below is Niklas's stated direction, not speculation.

## Where things stand right now (handoff state)

- v1 code-complete, **deployed and live at https://dnd-app-dun.vercel.app** (Vercel project
  `dnd-app`, scope `niklas-ellies-projects`; GitHub integration auto-deploys `main` to
  production — pushing = deploying). Env vars set for Preview + Production.
- **Still manual, blocking real logins on prod** (Supabase dashboard only, no API):
  1. Auth → URL Configuration: Site URL `https://dnd-app-dun.vercel.app`, add
     `https://dnd-app-dun.vercel.app/**` to redirect URLs.
  2. Auth → SMTP: wire a custom sender (e.g. Resend) — built-in mailer is rate-limited to a
     few emails/hour; one table's magic-link logins will exhaust it.
  3. Then test a real magic-link login on prod. After that: the dark-launch playtest
     (`docs/launch-post.md`), before any new features.

## Concept assessment (2026-07-06)

**Verdict: the concept is strong; the cards are the weakest part as built; the chat
end-goal is the payoff the architecture has been accidentally building toward.**

- The chronicle-vs-encyclopedia wedge is real differentiation vs. Kanka/World Anvil.
  The **secret→reveal mechanic is the crown jewel**: it gives the DM a reason to enter data
  *before* it's public (prep becomes future content) and players a reason to log in between
  sessions (something might have dropped) — one mechanic, both sides of the cold start.
- **Existential risk (unchanged, no feature fixes it):** the loop runs on the DM writing
  recaps every session. Chronicle products die of logging fatigue. That's what the playtest
  tests. Don't build consumers of the chronicle before proving people feed it.

### The cards: right idea, currently a dead end

Anti-wiki one-liner cards are the correct instinct, **but today a card is a static
profile**: the entity page (`src/app/(app)/campaigns/[id]/entities/[entityId]/page.tsx`)
shows name/summary/notes/status/private note and *nothing that has happened to the entity* —
the moments referencing it (`log_entries.entity_id`) and its quotes never appear on its page.

That inverts the differentiator. A wiki page is what the DM *writes about* an NPC; our card
should be what the table *lived through with* it — reveal, betrayal, death, quotes —
assembled automatically from the chronicle. With that, cards compound in value every session
with zero extra data entry; without it they decay after their reveal moment.

**Fix is cheap and near-top of Phase 2:** on the entity page, query
`log_entries where entity_id = :id order by created_at` (+ optionally quotes) and render a
per-card mini-timeline. RLS already filters it per viewer.

Known structural limits (fine for now, matter later): a moment references only **one**
entity (a betrayal involves two); `quotes.speaker` is free text, unlinked to any card/member.

## End-goal: the DM chats with his campaign

Stated by Niklas 2026-07-06. It is coherent and the architecture is unusually well
positioned for it:

1. **Visibility-aware answers are the killer feature, and RLS gives them for free.**
   The DM's most common question is "what does the party actually *know* about X?" Every row
   carries `secret`/`shared`, so chat can answer from the player-visible subset vs. the full
   DM view. Critically: **run retrieval through the user's RLS-scoped Supabase client**
   (same "trust RLS, never re-filter in app code" principle as everywhere else) — then a
   player-facing chat *cannot* leak secrets by construction; the model never sees rows the
   user can't see.
2. **`revealed_at` enables time-travel questions** — "what did the party know going into
   session 5?" is answerable because reveals are timestamped.
3. **v1 of chat needs no RAG.** A campaign's corpus (50 sessions of recaps + moments +
   cards + quotes) is ~30–40k tokens — fits in one context window. Select through the
   user's client, serialize to markdown, prompt. Stack fit: Vercel AI SDK / AI Gateway.
   pgvector on Supabase only if campaigns outgrow the window.
4. **It reinforces the weak link instead of straining it** — every recap makes the campaign
   brain smarter (a second compounding reason to log). And the same AI attacks logging
   friction from the other side: a **recap-writing assistant** ("bullet points in → recap
   draft + suggested moments to log + cards to create"). **Sequence: recap assistant first
   (Phase 2 — it feeds the corpus), chat second (Phase 3 headline — it consumes it).**
5. **Monetization:** chat costs money per use → the natural paid tier. "The chronicle is
   free; the campaign brain is paid." Still gated on the north star (`requirements.md` §6).

### Data-model prerequisites (build when the features need them, not before)

- Many-to-many entity mentions on moments (`log_entry_entities` join table, or @-mentions
  parsed from recap/moment bodies).
- `quotes.speaker` → optional link to entity or member.
- The card mini-timeline fix above.
- Note the convergence: **the deferred v1.5 graph viz wants exactly the same substrate as
  chat.** One investment, two features.

## For the next agent

- Scope law: `requirements.md` §3 "Raus" list. Feature test: chronicle-not-encyclopedia +
  north-star gate (DM ≥2 sessions in a row, ≥1 player login between sessions).
- Security law: `docs/security.md` — read before touching RLS/helpers/SECURITY DEFINER.
- Sequencing: `docs/roadmap.md` (kept current; Phase 0 items 1–2 done, 3–5 pending manual
  Supabase dashboard steps above).
- The AI direction in this file is the long-term "why" behind Phase 2/3 ordering.
