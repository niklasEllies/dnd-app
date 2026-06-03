export const meta = {
  name: 'polish-audit-week4',
  description: 'Audit the whole app for Week-4 polish: empty states, mobile/responsive, DM-vs-player coherence, a11y/consistency, jank — return a verified, prioritized punch-list',
  phases: [
    { title: 'Audit', detail: '5 dimension auditors sweep the app' },
    { title: 'Verify', detail: 'each finding verified as real + actionable' },
  ],
}

const CONTEXT = `
PROJECT: "Campaign Memory" — Next.js 16 App Router + TS + Tailwind v4 + shadcn (Base UI). A living chronicle for a tabletop group: campaigns, sessions (DM markdown recaps), quotes, entity cards (NPC/location/faction) with a secret->reveal mechanic, a log_entries timeline, private notes. Two views: DM (sees + curates everything) and player (sees only shared rows + own private notes; RLS enforces this). Dark/angular/minimal with a sage accent. Target: usable at the table on a phone.

This is the WEEK-4 polish pass (no new features). Find the rough edges that stop it from feeling good in a real session. Read files under C:/Users/Niklas/projects/dndApp/src/ — use Glob/Grep/Read. Key areas:
- Pages: src/app/page.tsx (landing), src/app/login/page.tsx, src/app/(app)/layout.tsx + dashboard/page.tsx, src/app/(app)/campaigns/[id]/page.tsx, .../sessions/[sessionId]/page.tsx, .../entities/page.tsx, .../entities/[entityId]/page.tsx, .../timeline/page.tsx
- Components: src/components/*.tsx (app-nav, campaign-nav, entity-card, entity-dialog, timeline-list, add-moment-form, add-quote-form, quote-list, new-session-dialog, recap-editor, new-campaign-dialog, join-campaign-dialog, copy-invite, set-character-name, private-note-editor, markdown) and src/components/ui/*
- Theme: src/app/globals.css

Out of scope: re-flagging RLS/security (already audited) unless it surfaces as a player-visible UX leak. Focus on polish.
`;

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          area: { type: 'string', description: 'file or screen' },
          severity: { type: 'string', enum: ['high', 'medium', 'low', 'nit'] },
          kind: { type: 'string', enum: ['empty-state', 'responsive', 'two-views', 'a11y', 'consistency', 'jank', 'bug'] },
          explanation: { type: 'string' },
          fix: { type: 'string', description: 'concrete, minimal fix' },
        },
        required: ['title', 'area', 'severity', 'kind', 'explanation', 'fix'],
      },
    },
  },
  required: ['findings'],
}

const DIMENSIONS = [
  { key: 'first-run', focus: `First-run & empty states. Walk a brand-new user (no campaigns), an empty campaign (no sessions/quotes/entities/timeline yet), and a player who has had nothing shared. Is every empty state present, friendly, and pointing to the next action? Is onboarding clear (how do I create vs join)? Dead ends?` },
  { key: 'responsive', focus: `Mobile / responsive — the app must be usable at the table on a phone. Look for fixed widths (e.g. w-56 inputs), grids that don't collapse, horizontal overflow, the top nav + campaign sub-nav wrapping, dialogs/forms on small screens, tap-target sizes, long invite codes / names overflowing. Cite specific classNames.` },
  { key: 'two-views', focus: `DM-vs-player coherence. Does the player experience read coherently end to end? Any DM-only affordance shown to players, confusing labels, or copy that implies hidden content exists? Is it obvious to the DM what players can/can't see (secret badges, "players can't see this yet")? Any awkward state when nothing is shared?` },
  { key: 'a11y-consistency', focus: `Accessibility & consistency. Form labels/ids, focus-visible states, heading hierarchy, button-vs-link semantics, aria on icon-only controls, color contrast of sage/muted on dark, consistent spacing/wording/casing across pages, the native <select> styling vs shadcn inputs. Flag concrete, fixable items.` },
  { key: 'jank-bugs', focus: `Jank & small bugs across the real flows (create campaign -> session -> recap -> quotes -> entity -> reveal -> timeline). Missing pending/loading feedback, revalidation gaps causing stale views, date formatting, markdown edge cases, broken/awkward navigation, anything that breaks the "feels good" bar. Not security (covered elsewhere).` },
]

phase('Audit')
const results = await pipeline(
  DIMENSIONS,
  (d) => agent(
    `You are a senior product engineer doing a Week-4 polish audit. Audit ONLY your dimension; read the actual files first.\n\n${CONTEXT}\n\nYOUR DIMENSION: ${d.focus}\n\nReturn concrete, minimal, actionable findings (area + severity + fix). Prefer high-signal items that materially improve a real session; skip nitpicks unless cheap and clearly worth it. If the dimension is genuinely clean, return an empty array.`,
    { schema: SCHEMA, phase: 'Audit', label: `audit:${d.key}` },
  ),
  (review, d) => parallel((review.findings || []).map((f) => () =>
    agent(
      `You are verifying a Week-4 polish finding. Read the actual file(s) and decide if it is REAL and worth fixing now (not a false positive, not already handled). Cite the deciding line(s). Keep it (refining severity/fix) or drop it.\n\n${CONTEXT}\n\nFINDING:\ntitle: ${f.title}\narea: ${f.area}\nseverity: ${f.severity}\nkind: ${f.kind}\nexplanation: ${f.explanation}\nfix: ${f.fix}\n\nReturn a single-element findings array if REAL+worthwhile, else an empty array.`,
      { schema: SCHEMA, phase: 'Verify', label: `verify:${d.key}` },
    ).then((v) => (v.findings || []).map((x) => ({ ...x, dimension: d.key }))),
  )),
)

const verified = results.flat(2).filter(Boolean)
const order = { high: 0, medium: 1, low: 2, nit: 3 }
verified.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))
return {
  total: verified.length,
  by_severity: verified.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity] || 0) + 1 }), {}),
  findings: verified,
}
