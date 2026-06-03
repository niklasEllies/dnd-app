# Graph Report - .  (2026-06-03)

## Corpus Check
- Corpus is ~16,157 words - fits in a single context window. You may not need a graph.

## Summary
- 307 nodes · 498 edges · 23 communities (15 shown, 8 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 149,207 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Campaign UI & Server Actions|Campaign UI & Server Actions]]
- [[_COMMUNITY_Database Schema & RLS Security|Database Schema & RLS Security]]
- [[_COMMUNITY_App Shell & Navigation|App Shell & Navigation]]
- [[_COMMUNITY_shadcn Component Config|shadcn Component Config]]
- [[_COMMUNITY_Core Architecture Visibility Asymmetry|Core Architecture: Visibility Asymmetry]]
- [[_COMMUNITY_Generated DB Types & Session Proxy|Generated DB Types & Session Proxy]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Pages & Auth Wiring|Pages & Auth Wiring]]
- [[_COMMUNITY_UI Primitives & Login Form|UI Primitives & Login Form]]
- [[_COMMUNITY_Build Tooling & Dev Dependencies|Build Tooling & Dev Dependencies]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Schema-Design Workflow Script|Schema-Design Workflow Script]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_Claude  MCP Settings|Claude / MCP Settings]]
- [[_COMMUNITY_Code-Review Workflow Script|Code-Review Workflow Script]]
- [[_COMMUNITY_Next.js 16 Conventions|Next.js 16 Conventions]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_MCP Supabase Connection|MCP Supabase Connection]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Base UI render Gotcha|Base UI render Gotcha]]
- [[_COMMUNITY_text + CHECK over Enums|text + CHECK over Enums]]
- [[_COMMUNITY_Separator Primitive|Separator Primitive]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 45 edges
2. `compilerOptions` - 16 edges
3. `createClient()` - 14 edges
4. `is_dm()` - 13 edges
5. `is_member()` - 11 edges
6. `LoginForm()` - 8 edges
7. `Button()` - 8 edges
8. `Core Architecture: visibility asymmetry in DB not app code` - 8 edges
9. `campaign_members table` - 7 edges
10. `tailwind` - 6 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --implements--> `Never re-implement visibility filtering in app layer`  [INFERRED]
  src/app/(app)/dashboard/page.tsx → CLAUDE.md
- `DashboardPage()` --conceptually_related_to--> `Membership SECURITY DEFINER RPCs (create_campaign / join_campaign)`  [INFERRED]
  src/app/(app)/dashboard/page.tsx → requirements.md
- `CampaignPage (campaign detail + members, 404 for non-members)` --implements--> `Never re-implement visibility filtering in app layer`  [INFERRED]
  src/app/(app)/campaigns/[id]/page.tsx → CLAUDE.md
- `AppLayout (protected route gate + profile fetch)` --implements--> `Passwordless magic-link auth flow`  [INFERRED]
  src/app/(app)/layout.tsx → README.md
- `GET()` --implements--> `Passwordless magic-link auth flow`  [EXTRACTED]
  src/app/auth/callback/route.ts → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Magic-link auth + session-gating flow** — callback_route_get, _app_layout_applayout, readme_magic_link_auth [INFERRED 0.80]
- **DB-enforced visibility asymmetry across docs and code** — dndapp_requirements_visibility_asymmetry, dndapp_requirements_rls_security_boundary, dndapp_requirements_reveal_mechanic, claude_visibility_asymmetry_architecture, _id__page_campaignpage [INFERRED 0.80]
- **Week-1 app files under adversarial review** — claude_wf_review_review_week1_app, callback_route_get, _app_layout_applayout, dashboard_page_dashboardpage, _id__page_campaignpage [EXTRACTED 1.00]
- **shadcn/ui primitives over Base UI** — button_button, card_card, dialog_dialog, dropdown_menu_dropdownmenu, input_input, label_label, avatar_avatar, badge_badge, separator_separator, textarea_textarea [INFERRED 0.85]
- **Campaign create/join dialog + server action flow** — new_campaign_dialog_newcampaigndialog, join_campaign_dialog_joincampaigndialog, campaigns_createcampaignaction, campaigns_joincampaignaction, campaigns_actionstate [INFERRED 0.85]
- **Secret/shared RLS visibility asymmetry across entities, log_entries, quotes** — concept_rls_visibility_asymmetry, migrations_0004_rls_policies_entities_select, migrations_0004_rls_policies_log_entries_select, migrations_0004_rls_policies_quotes_select, migrations_0003_security_helpers_is_dm [INFERRED 0.85]
- **Membership flow: create_campaign + join_campaign + campaign_members + is_dm** — migrations_0005_rpcs_create_campaign, migrations_0005_rpcs_join_campaign, migrations_0002_tables_campaign_members, migrations_0003_security_helpers_is_dm [INFERRED 0.85]
- **SECURITY DEFINER recursion break: is_member/is_dm + campaign_members + NO FORCE invariant** — migrations_0003_security_helpers_is_member, migrations_0003_security_helpers_is_dm, migrations_0002_tables_campaign_members, concept_no_force_rls_invariant [INFERRED 0.85]

## Communities (23 total, 8 thin omitted)

### Community 0 - "Campaign UI & Server Actions"
Cohesion: 0.11
Nodes (32): ActionState, createCampaignAction(), joinCampaignAction(), CopyInvite(), Member, cn(), Avatar(), AvatarBadge() (+24 more)

### Community 1 - "Database Schema & RLS Security"
Cohesion: 0.08
Nodes (39): createCampaignAction, joinCampaignAction, Membership mutations only via SECURITY DEFINER RPC, campaign_members NO FORCE RLS invariant, Reveal mechanic (revealed_at + visibility flip), RLS secret/shared visibility asymmetry, SECURITY DEFINER RLS recursion break, Storage RLS gates membership not entity visibility (residual risk) (+31 more)

### Community 2 - "App Shell & Navigation"
Cohesion: 0.12
Nodes (14): signOut(), AppNav(), initials(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel() (+6 more)

### Community 3 - "shadcn Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 4 - "Core Architecture: Visibility Asymmetry"
Cohesion: 0.19
Nodes (21): AppLayout (protected route gate + profile fetch), CampaignPage (campaign detail + members, 404 for non-members), GET(), Never re-implement visibility filtering in app layer, Core Architecture: visibility asymmetry in DB not app code, review-week1-app adversarial review workflow, design-verify-schema RLS design/attack workflow, DashboardPage() (+13 more)

### Community 5 - "Generated DB Types & Session Proxy"
Cohesion: 0.13
Nodes (16): Session refresh + protected-route gating, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json (+8 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "Pages & Auth Wiring"
Cohesion: 0.16
Nodes (13): AppNav, FEATURES, Home(), signOut (server action), Avatar, JoinCampaignDialog(), NewCampaignDialog(), Membership (+5 more)

### Community 8 - "UI Primitives & Login Form"
Cohesion: 0.16
Nodes (18): Badge, Base UI render prop composition, Button, buttonVariants, Card, CopyInvite, Dialog, DialogContent (+10 more)

### Community 9 - "Build Tooling & Dev Dependencies"
Cohesion: 0.11
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 10 - "Runtime Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @base-ui/react, class-variance-authority, clsx, lucide-react, next, next-themes, react (+7 more)

### Community 11 - "Schema-Design Workflow Script"
Cohesion: 0.20
Nodes (9): ANGLES, ATTACK_SCHEMA, broken, DESIGN_SCHEMA, FINAL_SCHEMA, meta, SCENARIOS, SYNTH_SCHEMA (+1 more)

### Community 12 - "Root Layout & Fonts"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Toaster()

### Community 13 - "Claude / MCP Settings"
Cohesion: 0.40
Nodes (4): enableAllProjectMcpServers, enabledMcpjsonServers, permissions, allow

### Community 14 - "Code-Review Workflow Script"
Cohesion: 0.40
Nodes (4): DIMENSIONS, FINDINGS_SCHEMA, meta, verified

## Knowledge Gaps
- **114 isolated node(s):** `allow`, `enableAllProjectMcpServers`, `enabledMcpjsonServers`, `meta`, `FINDINGS_SCHEMA` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Pages & Auth Wiring` to `Campaign UI & Server Actions`, `Database Schema & RLS Security`, `App Shell & Navigation`, `Generated DB Types & Session Proxy`, `UI Primitives & Login Form`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `cn()` connect `Campaign UI & Server Actions` to `App Shell & Navigation`, `Pages & Auth Wiring`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `createClient()` (e.g. with `updateSession()` and `createClient()`) actually correct?**
  _`createClient()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `allow`, `enableAllProjectMcpServers`, `enabledMcpjsonServers` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Campaign UI & Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.11020408163265306 - nodes in this community are weakly interconnected._
- **Should `Database Schema & RLS Security` be split into smaller, more focused modules?**
  _Cohesion score 0.08048780487804878 - nodes in this community are weakly interconnected._
- **Should `App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._