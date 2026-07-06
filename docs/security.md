# Security & data model

The entire DM-vs-player access model lives in **Postgres Row-Level Security**, not in
app code. The browser uses only the **publishable** key; there is no service-role key
anywhere in the app. The app never re-implements visibility filtering — it trusts RLS.
Migrations `0002`–`0013` in `supabase/migrations/` are the source of truth.

## Building blocks

- **Helper functions** `is_member(c)`, `is_dm(c)`, `shares_campaign(other)` — `LANGUAGE sql
  SECURITY DEFINER STABLE SET search_path = ''`, schema-qualified. They read
  `campaign_members` on behalf of policies.
- **`campaign_members` is `NO FORCE ROW LEVEL SECURITY`** (asserted in `0008`). Combined
  with the SECURITY DEFINER helpers (owned by the table owner), this is what breaks the
  RLS recursion that a naive policy would hit (a `campaign_members` SELECT policy calling
  `is_dm`, which itself reads `campaign_members`).
- **Membership & reveal go through `SECURITY DEFINER` RPCs** — `create_campaign`,
  `join_campaign(code, character_name?)`, `reveal_entity`, `hide_entity`. Each checks
  `is_dm`/`auth.uid()` itself, forces server-side values (role, `created_by`), and is
  idempotent. `campaign_members` has **no** INSERT/UPDATE/DELETE policy except a
  column-scoped `character_name` self-update — all other membership writes are RPC-only.
- **Consistency triggers** (`0011`) enforce that a child row's `session_id`/`entity_id`
  belongs to the same campaign as the row.

## Per-table policy summary (all policies are `TO authenticated`; anon matches nothing)

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | own + co-members (`shares_campaign`) | own only |
| `campaigns` | `is_member` or `dm_id = auth.uid()` | update/delete `is_dm`; insert RPC-only |
| `campaign_members` | own or `is_dm` | `character_name` self-update only; rest RPC-only |
| `sessions` | `is_member` | `is_dm` (insert pins `created_by`) |
| `entities`, `log_entries`, `quotes` | `is_member AND (visibility='shared' OR is_dm)` | `is_dm` (canon); `quotes` insert = member-as-self, update/delete = author or DM |
| `private_notes` | author only (`AND is_member`) | author only |
| storage `entity-images` | member of the path's campaign | DM of the path's campaign |

## ⚠️ Do NOT

- **Do not revoke `EXECUTE` on `is_member`/`is_dm`/`shares_campaign` from `authenticated`.**
  RLS policy expressions run as the *querying* role, so the role must be able to call the
  functions — revoking it breaks **every** read with `permission denied for function`
  (this exact mistake happened once; fixed in `0009`).
- **Do not `FORCE ROW LEVEL SECURITY` on `campaign_members`** — it reintroduces the
  recursion (`0008` asserts against it).
- **Do not re-implement visibility filtering in the app.** If a player can see a secret,
  the bug is in a policy, not a component.
- Keep every `SECURITY DEFINER` function `SET search_path = ''` and schema-qualified.

## Accepted advisories (not bugs)

- **`0029` "Signed-In Users Can Execute SECURITY DEFINER Function" ×7** —
  `create_campaign`, `join_campaign`, `reveal_entity`, `hide_entity`, `is_member`,
  `is_dm`, `shares_campaign`. The RPCs *must* be callable and self-check `is_dm`; the
  helpers only ever report the **caller's own** membership (`auth.uid()` internally).
  Accepted.
- **Leaked-password protection disabled** — irrelevant; auth is passwordless magic link.
  A one-click dashboard toggle if passwords are ever added.
- **`0005` "Unused Index" ×10 (INFO)** — expected on a near-empty DB; the indexes back
  FK lookups the app uses and will register usage with real data. Keep them.
- **`npm audit`: 1 moderate `postcss`** — transitive inside Next's own bundle
  (`next/node_modules/postcss`), a build-time CSS stringify XSS not reachable in our usage
  (we never stringify untrusted CSS). The only `npm audit fix --force` remedy downgrades
  Next to 9.x — **do not run it**. Revisit when Next ships a patched release.

## Residual risks (documented, deferred)

- **Secret-entity image via storage** — `entity-images` RLS gates on campaign membership,
  not per-row `entities.visibility`. A member who guesses a still-secret card's image path
  could fetch the binary (the DB row stays hidden). Mitigate later with random filenames +
  upload-on-reveal, or a `can_read_entity_image()` definer check. Image upload UI isn't
  built yet, so this is latent.
- **Sessions have no `visibility`** — a session is player-visible the moment it's created
  (recaps are the shared chronicle by design). The "New session" copy warns the DM not to
  draft secrets there. A future `sessions.visibility` + reveal would close this if wanted.
- **`created_by` / `author_id` nullable** — fail-closed: a NULL `created_by` makes a quote
  editable only by the DM; no escalation.

## How this was verified

Adversarial multi-agent review of the schema (13 attack scenarios) and of each week's
code, plus empirical RLS simulations run as `authenticated` with `request.jwt.claims` set
(member reads secret → 0 rows; non-member → 0; player write/reveal → denied; cross-campaign
attach → blocked; reveal→hide hides the timeline moment). Re-run `get_advisors` after any
schema change.
