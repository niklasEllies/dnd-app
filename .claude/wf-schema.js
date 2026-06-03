export const meta = {
  name: 'design-verify-schema',
  description: 'Design the complete Supabase schema + RLS for the campaign-memory app, then adversarially attack the policies before finalizing the migration set',
  phases: [
    { title: 'Design', detail: '3 independent complete-schema designs (security / simplicity / spec-fidelity angles)' },
    { title: 'Synthesize', detail: 'merge candidates into one ordered migration set' },
    { title: 'Attack', detail: '13 independent skeptics each try to break the RLS / RPCs' },
    { title: 'Finalize', detail: 'incorporate verified fixes + Supabase hardening into final migrations' },
  ],
}

const SPEC = `
PRODUCT: A campaign-memory app for tabletop RPG groups (NOT a worldbuilding wiki). One DM curates the canon; N players. The entire access asymmetry (DM sees secrets; players see only what is shared + their own private notes) is enforced in Postgres Row-Level Security — NOT in app code. A "reveal" is just an UPDATE setting visibility 'secret' -> 'shared' that only the DM may perform; RLS then makes the row appear to players automatically.

TARGET: Supabase Postgres. auth.users exists; auth.uid() returns the current user's uuid (null if unauthenticated). Convention: text + CHECK constraints (NOT enums), UUID PKs.

TABLES (verbatim from the build-spec section 4):

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz default now()
);

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  system      text,
  description text,
  dm_id       uuid not null references profiles(id),
  invite_code text unique default encode(gen_random_bytes(6),'hex'),
  created_at  timestamptz default now()
);

create table campaign_members (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  role           text not null check (role in ('dm','player')),
  character_name text,
  joined_at      timestamptz default now(),
  unique (campaign_id, user_id)
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  number      int,
  title       text,
  played_on   date,
  recap       text,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);  -- NOTE: sessions has NO visibility column; recaps are part of the shared chronicle (members read all sessions of their campaign).

create table quotes (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id  uuid references sessions(id) on delete set null,
  body        text not null,
  speaker     text,
  visibility  text not null default 'shared' check (visibility in ('secret','shared')),
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

create table entities (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  type        text not null check (type in ('npc','location','faction')),
  name        text not null,
  summary     text,
  notes       text,
  image_url   text,
  status      text check (status in ('alive','dead','unknown')),
  visibility  text not null default 'secret' check (visibility in ('secret','shared')),
  revealed_at timestamptz,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

create table log_entries (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id  uuid references sessions(id) on delete set null,
  entity_id   uuid references entities(id) on delete set null,
  type        text not null check (type in ('reveal','death','decision','loot','milestone','note')),
  body        text not null,
  visibility  text not null default 'shared' check (visibility in ('secret','shared')),
  revealed_at timestamptz,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

create table private_notes (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  entity_id   uuid references entities(id) on delete set null,
  session_id  uuid references sessions(id) on delete set null,
  body        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

HELPER FUNCTIONS (spec; SECURITY DEFINER to break RLS recursion on campaign_members):
  is_member(c uuid) returns boolean  -> true if auth.uid() is a member of campaign c
  is_dm(c uuid)     returns boolean  -> true if auth.uid() is a member of campaign c with role 'dm'

RLS PATTERNS (spec):
  entities/sessions/log_entries SELECT: is_member(campaign_id) and (visibility='shared' or is_dm(campaign_id))   [sessions has no visibility -> just is_member]
  entities/sessions/log_entries WRITE (all): is_dm(campaign_id)
  quotes SELECT: is_member and (visibility='shared' or is_dm); quotes INSERT: is_member and created_by = auth.uid()
  private_notes ALL: author_id = auth.uid()
  campaign_members SELECT: user_id = auth.uid() or is_dm(campaign_id)
`;

const GAPS_AND_DIRECTIVES = `
The spec's SQL is an illustrative PATTERN and is INCOMPLETE for a working app. You MUST fill these gaps and follow these directives so the WEEK-1 flow works: a logged-in user creates a campaign and becomes its DM; a second user joins via invite code and becomes a player; both then see the campaign.

1. profiles auto-creation: add a trigger function public.handle_new_user() (AFTER INSERT ON auth.users) that inserts a profiles row (id = new.id, display_name = coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))). SECURITY DEFINER.

2. profiles RLS: enable RLS. SELECT: a user may read profiles of people who share a campaign with them, plus their own (define a SECURITY DEFINER helper shares_campaign(other uuid) OR justify a simpler 'authenticated may read all profiles' if you judge display_name/avatar non-sensitive — pick one and justify). INSERT/UPDATE: own row only (id = auth.uid()).

3. campaigns RLS: enable RLS. SELECT: is_member(id) OR dm_id = auth.uid()  (the OR dm_id is REQUIRED so the creator can read the campaign row returned immediately after creation, before/without a members row). UPDATE/DELETE: is_dm(id). Do NOT expose a broad INSERT policy — campaign creation goes through the RPC below.

4. campaign_members: the spec gives ONLY a SELECT policy. There is NO INSERT/UPDATE/DELETE policy — so direct membership mutation is impossible (RLS denies by default). Membership changes MUST go through SECURITY DEFINER RPCs:
   - public.create_campaign(p_name text, p_system text, p_description text) RETURNS campaigns: require auth.uid() not null; INSERT a campaign with dm_id = auth.uid(); INSERT a campaign_members row (campaign_id, user_id = auth.uid(), role 'dm'); RETURN the new campaign row.
   - public.join_campaign(p_invite_code text) RETURNS campaigns: require auth.uid() not null; find the campaign by invite_code; if none, RAISE a clear exception; if the caller is already a member, return the existing campaign idempotently (do not error, do not duplicate); otherwise INSERT a campaign_members row (user_id = auth.uid(), role 'player' — the caller may NOT choose role or user_id); RETURN the campaign. Beware: the caller is not yet a member when looking up the campaign, so this lookup must run with definer privilege.
   GRANT EXECUTE on both RPCs to role authenticated; ensure anon cannot execute them.

5. sessions/entities/log_entries/quotes/private_notes RLS: implement per the spec patterns. Add quotes UPDATE/DELETE: (created_by = auth.uid() OR is_dm(campaign_id)). created_by/author_id columns should be defaulted or set server-side; ensure INSERT WITH CHECK ties created_by to auth.uid() where the spec requires it.

6. Storage: create a PRIVATE bucket 'entity-images'. Path convention: the first folder segment is the campaign_id. storage.objects policies (bucket_id = 'entity-images'): SELECT where is_member((storage.foldername(name))[1]::uuid); INSERT/UPDATE/DELETE where is_dm((storage.foldername(name))[1]::uuid) (only the DM curates entity images). Note and flag the residual risk that a player who is a member could fetch the image of a still-SECRET entity (storage RLS checks membership, not per-row entity visibility).

7. SUPABASE HARDENING (Supabase's linter will flag these — get them right up front):
   - Every SECURITY DEFINER function MUST set search_path to empty (SET search_path = '') and therefore schema-qualify ALL object references: public.x, auth.users, storage.foldername, etc.
   - is_member/is_dm/shares_campaign: LANGUAGE sql, SECURITY DEFINER, STABLE, set search_path. create_campaign/join_campaign/handle_new_user: plpgsql, SECURITY DEFINER, set search_path.
   - Enable RLS on EVERY table in public (including profiles, campaigns, campaign_members).
   - Add indexes on all foreign-key columns used in policies/queries (campaign_id on each table; campaign_members(user_id); etc.).
   - Set created_by / author_id defaults to auth.uid() where appropriate, OR rely on app to set; ensure WITH CHECK still validates.
   - REVOKE default execute from public/anon on the RPCs; GRANT to authenticated.
`;

phase('Design')
const ANGLES = [
  { key: 'security', focus: `Prioritize airtight access control: assume a motivated malicious player and a curious non-member. Make every policy fail-closed. Be paranoid about the RPCs and search_path.` },
  { key: 'simplicity', focus: `Prioritize the smallest correct policy set that a future maintainer can read in one sitting. Avoid cleverness; prefer obvious policies and minimal helpers. Still fully correct.` },
  { key: 'spec-fidelity', focus: `Stay as close as possible to the build-spec's exact DDL and RLS patterns, deviating ONLY where the gaps list proves a deviation is required for the Week-1 flow to function. Document each deviation.` },
]

const DESIGN_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    full_sql: { type: 'string', description: 'Complete, runnable SQL for the ENTIRE schema: tables, helper functions, triggers, RLS enable + all policies, RPCs, storage bucket + policies, indexes, grants. Idempotent where reasonable.' },
    key_decisions: { type: 'string', description: 'Bullet list of the non-obvious decisions and why (esp. profiles SELECT scope, RPC design, storage).' },
    gaps_resolved: { type: 'string', description: 'How each of the 7 gap/directive items was handled.' },
  },
  required: ['full_sql', 'key_decisions', 'gaps_resolved'],
}

const designs = await parallel(ANGLES.map(a => () =>
  agent(
    `You are a senior PostgreSQL + Supabase RLS engineer. Produce a COMPLETE, runnable schema with airtight Row-Level Security for this app.\n\n${SPEC}\n\n${GAPS_AND_DIRECTIVES}\n\nDESIGN ANGLE for THIS pass: ${a.focus}\n\nReturn the full SQL (everything needed, in correct dependency order), your key decisions, and how you resolved each gap. The SQL must be directly applicable to a fresh Supabase Postgres database.`,
    { schema: DESIGN_SCHEMA, phase: 'Design', label: `design:${a.key}` }
  )
)).then(r => r.filter(Boolean))

phase('Synthesize')
const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    migrations: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'snake_case migration name, e.g. 01_tables' },
          purpose: { type: 'string' },
          sql: { type: 'string', description: 'runnable SQL for this migration' },
        },
        required: ['name', 'purpose', 'sql'],
      },
    },
    rpc_signatures: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string', description: 'What was taken from which design and why.' },
  },
  required: ['migrations', 'rpc_signatures', 'rationale'],
}
const synth = await agent(
  `You are the lead engineer. Below are ${designs.length} independent complete-schema designs for the same app. Synthesize the SINGLE BEST, fully-correct schema, taking the strongest ideas from each and discarding weaker ones.\n\nORIGINAL SPEC:\n${SPEC}\n\nGAPS & DIRECTIVES (authoritative — the result MUST satisfy all of these):\n${GAPS_AND_DIRECTIVES}\n\nCANDIDATE DESIGNS:\n${designs.map((d, i) => `\n===== DESIGN ${i + 1} (${ANGLES[i] ? ANGLES[i].key : 'n/a'}) =====\nKEY DECISIONS:\n${d.key_decisions}\nGAPS RESOLVED:\n${d.gaps_resolved}\nSQL:\n${d.full_sql}`).join('\n')}\n\nOutput an ORDERED set of migrations (each independently runnable, in dependency order: tables -> helpers -> RLS+policies -> RPCs -> storage -> indexes/grants is a reasonable grouping). Every SECURITY DEFINER function must SET search_path = '' and schema-qualify all references. Enable RLS on every public table. Make it correct and complete.`,
  { schema: SYNTH_SCHEMA, phase: 'Synthesize', label: 'synthesize' }
)

const synthSql = synth.migrations.map(m => `-- MIGRATION: ${m.name} (${m.purpose})\n${m.sql}`).join('\n\n')

phase('Attack')
const SCENARIOS = [
  { key: 'player-reads-secret', q: `As a PLAYER (member, role=player), attempt to SELECT a row of entities, log_entries, or quotes that has visibility='secret'. Can the player see it? It MUST be hidden.` },
  { key: 'nonmember-reads', q: `As an AUTHENTICATED NON-MEMBER, attempt to SELECT from campaigns, sessions, entities, quotes, log_entries, campaign_members, private_notes of a campaign you are not in. Anything readable? All MUST be denied.` },
  { key: 'player-writes-canon', q: `As a PLAYER, attempt INSERT/UPDATE/DELETE on entities, sessions, log_entries. All MUST be denied (only the DM curates canon).` },
  { key: 'player-reveals', q: `As a PLAYER, attempt the reveal UPDATE (set visibility='shared', revealed_at=now()) on an entity or log_entry. MUST be denied — reveal is DM-only.` },
  { key: 'join-abuse', q: `Attack join_campaign(): can a caller join WITHOUT a valid invite_code? Join with a wrong code? Choose role='dm' or another user_id? Cause a duplicate-member error or crash? Inject SQL via the code? Join a campaign twice? It must be idempotent, player-only, self-only, and reject bad codes cleanly.` },
  { key: 'create-abuse', q: `Attack create_campaign(): can a caller set dm_id to someone else, or create a membership for another user, or run it while unauthenticated (auth.uid() null)? It must always make the CALLER the dm and reject anon.` },
  { key: 'rls-recursion', q: `Check for RLS infinite recursion: do any policies on campaign_members (or campaigns) query campaign_members directly instead of via the SECURITY DEFINER helpers? Are is_member/is_dm actually SECURITY DEFINER + STABLE? Would a SELECT on campaign_members trigger recursive policy evaluation?` },
  { key: 'private-notes-leak', q: `As user B, attempt to SELECT or UPDATE user A's private_notes (same campaign). Can the DM read a player's private notes? All cross-user access MUST be denied — only the author, ever.` },
  { key: 'create-returning', q: `Immediately after create_campaign / join_campaign returns, can the caller SELECT that campaign row via the campaigns SELECT policy? Verify the policy covers the creator (dm_id=auth.uid()) AND members. A RETURNING/refetch that fails RLS would break the UX.` },
  { key: 'profiles-privacy', q: `Evaluate profiles RLS: can any authenticated user enumerate ALL profiles (privacy concern)? Can a user UPDATE/INSERT another user's profile? Is handle_new_user SECURITY DEFINER with locked search_path, and does signup actually create a profile? Does a missing profile break create_campaign (FK dm_id->profiles)?` },
  { key: 'storage-leak', q: `Attack the entity-images storage policies: is the bucket PRIVATE? Can a non-member read/list objects? Can a player upload (should be DM-only)? Can a member fetch the image of a still-SECRET entity (known residual risk — confirm and rate it)? Any path-parsing bypass (e.g., name without a folder segment crashing the cast)?` },
  { key: 'search-path-hardening', q: `Audit EVERY function: is it SECURITY DEFINER with SET search_path = '' and are ALL object references schema-qualified (public./auth./storage.)? An unqualified reference under empty search_path will ERROR; an unset search_path is a privilege-escalation risk. Flag any function missing this.` },
  { key: 'quotes-edit', q: `As a PLAYER, attempt to UPDATE or DELETE a quote created by ANOTHER member. Define expected behavior (own quotes + DM only) and confirm the policies enforce it. Also: can a non-member or the wrong user INSERT a quote with created_by spoofed to someone else?` },
  { key: 'completeness', q: `Step back: what is MISSING or inconsistent across the whole schema? Tables without RLS enabled? A policy referencing a column that does not exist? A FOR ALL policy that unintentionally also grants SELECT and conflicts with a narrower SELECT policy? Missing grants so authenticated cannot even reach the tables? created_at/updated_at trigger missing for private_notes? Anything that would make the Week-1 flow fail at runtime.` },
]

const ATTACK_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    scenario: { type: 'string' },
    attempt: { type: 'string', description: 'The concrete attack/query you reasoned through.' },
    broken: { type: 'boolean', description: 'true if the protection is broken / the directive is violated / a crash or recursion exists.' },
    severity: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
    explanation: { type: 'string' },
    fix: { type: 'string', description: 'If broken (or hardening needed), the exact SQL/policy change to apply. If fine, empty string.' },
  },
  required: ['scenario', 'attempt', 'broken', 'severity', 'explanation', 'fix'],
}

const attacks = await parallel(SCENARIOS.map(s => () =>
  agent(
    `You are a database security auditor doing an ADVERSARIAL review. Try hard to BREAK the following Supabase schema + RLS. Default to suspicion: if you are not certain a protection holds, treat it as broken and explain why.\n\nDIRECTIVES THE SCHEMA MUST SATISFY:\n${GAPS_AND_DIRECTIVES}\n\nTHE SCHEMA UNDER TEST:\n${synthSql}\n\nRPC SIGNATURES: ${synth.rpc_signatures.join('; ')}\n\nYOUR SPECIFIC ATTACK:\n${s.q}\n\nReason concretely about the actual policies/functions above (quote the relevant lines). Decide if it is broken, rate severity, and if broken or if hardening is missing, give the EXACT SQL fix.`,
    { schema: ATTACK_SCHEMA, phase: 'Attack', label: `attack:${s.key}` }
  )
)).then(r => r.filter(Boolean))

phase('Finalize')
const FINAL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    migrations: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'snake_case, ordered by dependency' },
          purpose: { type: 'string' },
          sql: { type: 'string' },
        },
        required: ['name', 'purpose', 'sql'],
      },
    },
    hardening_applied: { type: 'array', items: { type: 'string' } },
    fixes_incorporated: { type: 'array', items: { type: 'string' }, description: 'Each attack finding addressed and how.' },
    verification_notes: { type: 'string', description: 'How to verify the policies (queries to run as different roles / via the RPCs).' },
    residual_risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['migrations', 'hardening_applied', 'fixes_incorporated', 'verification_notes', 'residual_risks'],
}

const broken = attacks.filter(a => a.broken || (a.fix && a.fix.trim().length > 0))
const final = await agent(
  `You are the lead engineer finalizing the migration set. Start from the synthesized schema, then incorporate EVERY valid fix from the adversarial audit. Produce the final, ordered, runnable migration set for a fresh Supabase Postgres DB.\n\nSYNTHESIZED SCHEMA:\n${synthSql}\n\nRPC SIGNATURES: ${synth.rpc_signatures.join('; ')}\n\nADVERSARIAL FINDINGS (${broken.length} flagged of ${attacks.length}):\n${attacks.map(a => `\n[${a.scenario}] broken=${a.broken} severity=${a.severity}\n${a.explanation}\nFIX: ${a.fix || '(none)'}`).join('\n')}\n\nProduce the final migrations. Requirements: (1) apply all valid fixes; (2) every SECURITY DEFINER function sets search_path = '' and schema-qualifies all refs; (3) RLS enabled on every public table; (4) FK indexes present; (5) RPCs granted to authenticated only; (6) migrations are independently runnable in order and idempotent where reasonable. Keep them grouped logically (e.g. tables, security_helpers, rls_policies, rpcs, storage, indexes_grants). List residual risks honestly (e.g. secret-entity image via storage membership).`,
  { schema: FINAL_SCHEMA, phase: 'Finalize', label: 'finalize' }
)

return { final, attack_summary: attacks.map(a => ({ scenario: a.scenario, broken: a.broken, severity: a.severity })), synth_rationale: synth.rationale }
