export const meta = {
  name: 'review-week4-new',
  description: 'Review the new/changed Week-4 surface: invite-by-link round-trip, demo seed, shared submit/date components, and regressions from the polish edits',
  phases: [
    { title: 'Review', detail: '3 reviewers over invite-flow, demo+components, polish-regressions' },
    { title: 'Verify', detail: 'each finding independently verified' },
  ],
}

const CONTEXT = `
PROJECT: "Campaign Memory" — Next.js 16 App Router + TS + @supabase/ssr + shadcn(Base UI). RLS is the security boundary; publishable key only. Week 4 (polish) just added an invite-by-link flow, a one-click demo campaign, shared SubmitButton/LocalDate components, and ~20 small polish edits across the app.

Auth/middleware facts: middleware (src/lib/supabase/middleware.ts) gates non-public paths and, for a logged-out user, redirects to /login?next=<full path incl. query>. Login (src/app/login/page.tsx) sends a magic link with emailRedirectTo=/auth/callback?next=<next>; the callback (src/app/auth/callback/route.ts) exchanges the code and redirects to a same-origin next. PUBLIC_PATHS = ['/', '/login', '/auth'] — note /join is NOT public.

FILES TO REVIEW (read under C:/Users/Niklas/projects/dndApp/):
  src/lib/supabase/middleware.ts        (next now preserves query string)
  src/app/(app)/join/page.tsx
  src/components/join-by-code.tsx
  src/components/copy-invite.tsx
  src/lib/actions/demo.ts
  src/components/demo-campaign-button.tsx
  src/components/submit-button.tsx       (useFormStatus)
  src/components/local-date.tsx          (suppressHydrationWarning)
  src/components/quote-list.tsx          (now uses SubmitButton, server component rendering a client child inside <form>)
  src/components/entity-dialog.tsx, add-moment-form.tsx, set-character-name.tsx (shared selectClassName, responsive grids)
  src/app/(app)/campaigns/[id]/entities/[entityId]/page.tsx (reveal/hide SubmitButton + copy)
  src/lib/actions/campaigns.ts           (revalidatePath('/dashboard') added before redirect)
  src/components/recap-editor.tsx, timeline-list.tsx, app-nav.tsx
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
          file: { type: 'string' },
          location: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low', 'nit'] },
          category: { type: 'string', enum: ['build', 'auth', 'logic', 'rls-usage', 'next-correctness', 'regression', 'bug', 'ux'] },
          explanation: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['title', 'file', 'severity', 'category', 'explanation', 'fix'],
      },
    },
  },
  required: ['findings'],
}

const DIMENSIONS = [
  { key: 'invite-flow', focus: `Invite-by-link correctness end-to-end. CopyInvite builds the link; /join is auth-gated (logged-out bounces via middleware next=, which now includes the query string, then /login -> magic link -> /auth/callback?next= -> /join?code=). Trace the code surviving every hop (encoding/decoding, double-encoding, the safeNext same-origin check). JoinByCode reuses joinCampaignAction (idempotent for existing members). Does an already-member who clicks the link land correctly? Any open-redirect via next? Any case where the code is lost or the page dead-ends?` },
  { key: 'demo-and-components', focus: `Demo seed + shared components. demo.ts: do all inserts satisfy RLS (caller is DM after create_campaign) and the session/entity-campaign consistency triggers (quotes/log attached to session1 of the same campaign)? Any null session1 handling issue? SubmitButton: is useFormStatus used correctly (must be inside the <form>; quote-list is a server component rendering this client child inside <form action={serverAction}> — valid)? LocalDate: hydration (suppressHydrationWarning) and invalid-date handling. demo-campaign-button wiring.` },
  { key: 'polish-regressions', focus: `Regressions from the ~20 polish edits. Verify no broken JSX/props: selectClassName import used in entity-dialog + add-moment-form (no leftover selectCls refs); set-character-name still posts character_name; entity detail reveal/hide forms still submit the hidden fields with SubmitButton; recap-editor toast import; app-nav useTransition async signOut; campaigns.ts revalidate-then-redirect order; dialog max-height change didn't break layout; markdown overflow classes valid. Will it type-check and build under Next 16?` },
]

phase('Review')
const results = await pipeline(
  DIMENSIONS,
  (d) => agent(
    `You are a meticulous reviewer. Review ONLY your dimension; read the actual files first.\n\n${CONTEXT}\n\nYOUR DIMENSION: ${d.focus}\n\nReport concrete findings with file + location + a concrete fix. If clean, return an empty array. Precision over volume.`,
    { schema: SCHEMA, phase: 'Review', label: `review:${d.key}` },
  ),
  (review, d) => parallel((review.findings || []).map((f) => () =>
    agent(
      `Adversarially verify this Week-4 finding against the real file(s); cite the deciding line(s). Keep it if REAL (build/auth/logic/regression/runtime), else drop it.\n\n${CONTEXT}\n\nFINDING:\ntitle: ${f.title}\nfile: ${f.file}\nlocation: ${f.location || 'n/a'}\nseverity: ${f.severity}\ncategory: ${f.category}\nexplanation: ${f.explanation}\nfix: ${f.fix}\n\nReturn a single-element findings array if REAL, else empty.`,
      { schema: SCHEMA, phase: 'Verify', label: `verify:${d.key}` },
    ).then((v) => (v.findings || []).map((x) => ({ ...x, dimension: d.key }))),
  )),
)

const verified = results.flat(2).filter(Boolean)
return {
  total: verified.length,
  by_severity: verified.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity] || 0) + 1 }), {}),
  findings: verified,
}
