# Campaign-Memory-App — v1 Build-Spec (Arbeitstitel offen)

**Eine Zeile:** Kein Worldbuilding-Wiki. Das lebende Gedächtnis _eurer_ Runde — was passiert ist, wer was gesagt hat, und was eure Party noch nicht weiß.

---

## 1. Positionierung / der Keil

Kanka und World Anvil sind **Enzyklopädien**: comprehensive Datenbanken für den DM, der Lore und Entitäten sortiert. Stark, aber kalt — und niemand bedient die **geteilte, emotionale Erinnerung an genau dieses Spiel**.

Genau da setzt ihr an. Der Wert liegt nicht in der Vollständigkeit der Welt, sondern in der **Chronik der gemeinsamen Erlebnisse**: Recaps, Zitate, der Moment, in dem ein Geheimnis fiel. Das erzeugt:

- **Retention** — eine lebende Chronik über eine monatelange Kampagne ist klebrig.
- **Emotionale Bindung** — "weißt du noch, als …".
- **Mundpropaganda** — Spieler _sehen_ das Tool am Tisch und wollen es für ihre eigene Runde.

Nebeneffekt der Fokussierung: kein 5e-spezifischer Kram = **system-agnostisch** = unabhängig von WotC/OGL-Risiken und größerer Markt (Pathfinder, Daggerheart, alles).

## 2. Der Kern-Loop (das, was v1 können MUSS)

1. Nach (oder während) der Session: **Recap** schreiben.
2. **Quotes** festhalten — wer hat was gesagt.
3. **Momente** loggen — Reveals, Tode, Entscheidungen.
4. Diese hängen an **leichtgewichtigen Karten** (NPC/Ort/Fraktion). Der DM markiert Dinge **geheim** oder **geteilt**; ein **Reveal** flippt geheim → geteilt und landet auf der Timeline.

Spieler bekommen eine **eigene Sicht** (nur Geteiltes + eigene private Notizen) und einen Grund, sich auch zwischen den Sessions einzuloggen.

## 3. Scope

### Drin (v1)

- Auth + Profile
- **Eine** Kampagne pro Flow (Modell erlaubt mehrere, UI muss es nicht betonen), Einladung per Link
- Mitglieder: 1 DM, N Spieler (Rolle bestimmt die Sicht)
- **Sessions**: Nummer/Datum/Titel, Recap (Markdown), Liste/Timeline
- **Quotes**: Text + Sprecher, an Session hängbar, von jedem Mitglied einfügbar
- **Entities**: NPC/Ort/Fraktion als _Einzeiler-Karten_ (Name, Summary, optional Notizen/Bild/Status) — **kein Wiki**
- **Sichtbarkeit**: `secret`/`shared` pro Karte und pro Logeintrag; **DM-Sicht vs. Spieler-Sicht**; **Reveal**-Aktion
- **Log/Timeline**: getaggte Momente (reveal/death/decision/loot/milestone/note)
- **Private Notizen** je Spieler

### Raus (bewusst gestrichen — nicht anfassen, bis validiert)

- ❌ Graph-Visualisierung der Beziehungen (Politur → v1.5)
- ❌ Echtzeit-Kollaboration (async speichern reicht; Supabase Realtime später)
- ❌ Charakterbögen, Würfel, Initiative, Maps, Regeln, **alles System-Spezifische**
- ❌ Theory Board, Plot Threads, Handouts, Loot-Ökonomie
- ❌ Native Mobile-Apps (nur responsive Web)
- ❌ Öffentliches Publishing / SEO / "Kampagne veröffentlichen"
- ❌ Volltextsuche, Tags über das Nötigste hinaus, Exporte
- ❌ Bezahlung/Paywall (erst Haken nachweisen)

## 4. Datenmodell (Supabase / Postgres)

`text` + `CHECK` statt Enums (spart späteren Enum-Migrations-Schmerz). UUID-PKs.

```sql
-- 1:1 mit auth.users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz default now()
);

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  system      text,                        -- frei + kosmetisch ("D&D 5e", "Pathfinder")
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
  character_name text,                      -- der PC dieses Mitglieds
  joined_at      timestamptz default now(),
  unique (campaign_id, user_id)
);

-- Recap ist Teil der geteilten Chronik
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  number      int,
  title       text,
  played_on   date,
  recap       text,                         -- markdown
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- emotionales Gold; jedes Mitglied darf hinzufügen
create table quotes (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id  uuid references sessions(id) on delete set null,
  body        text not null,
  speaker     text,                         -- "Karlach", "Gravelthroat der Goblin"
  visibility  text not null default 'shared' check (visibility in ('secret','shared')),
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- leichtgewichtige Karten, KEIN Wiki
create table entities (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  type        text not null check (type in ('npc','location','faction')),
  name        text not null,
  summary     text,                         -- Einzeiler
  notes       text,                         -- markdown, optional
  image_url   text,
  status      text check (status in ('alive','dead','unknown')),
  visibility  text not null default 'secret' check (visibility in ('secret','shared')),
  revealed_at timestamptz,                  -- gesetzt beim Flip secret -> shared
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- Timeline der Momente + Reveal-Mechanik
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

-- nur der Autor sieht diese je
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
```

### Sichtbarkeit über Row-Level-Security

Helfer als `security definer` (umgeht die RLS-Rekursion bei `campaign_members`):

```sql
create or replace function is_member(c uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from campaign_members m
                 where m.campaign_id = c and m.user_id = auth.uid());
$$;

create or replace function is_dm(c uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from campaign_members m
                 where m.campaign_id = c and m.user_id = auth.uid() and m.role = 'dm');
$$;
```

Das Grundmuster (hier an `entities`, **identisch für `sessions` und `log_entries`**):

```sql
alter table entities enable row level security;

-- Lesen: Mitglieder sehen Geteiltes; der DM sieht alles
create policy entities_select on entities for select
using ( is_member(campaign_id)
        and (visibility = 'shared' or is_dm(campaign_id)) );

-- Schreiben: nur der DM kuratiert den Kanon
create policy entities_write on entities for all
using (is_dm(campaign_id)) with check (is_dm(campaign_id));
```

Sonderfälle:

```sql
-- Quotes: jedes Mitglied darf adden
alter table quotes enable row level security;
create policy quotes_select on quotes for select
using ( is_member(campaign_id) and (visibility = 'shared' or is_dm(campaign_id)) );
create policy quotes_insert on quotes for insert
with check ( is_member(campaign_id) and created_by = auth.uid() );

-- Private Notizen: nur der Autor, Punkt
alter table private_notes enable row level security;
create policy private_notes_all on private_notes for all
using (author_id = auth.uid()) with check (author_id = auth.uid());

-- campaign_members: jeder sieht seine eigene Mitgliedschaft;
-- der DM sieht alle Mitglieder seiner Kampagne
alter table campaign_members enable row level security;
create policy members_select on campaign_members for select
using ( user_id = auth.uid() or is_dm(campaign_id) );
```

### Die Reveal-Mechanik (der elegante Teil)

Ein Geheimnis enthüllen ist **ein Update** (per RLS nur dem DM erlaubt):

```sql
update entities set visibility = 'shared', revealed_at = now() where id = :id;
```

Die Spieler-Timeline ist einfach:

```sql
select * from log_entries where campaign_id = :id order by created_at;
```

RLS blendet Geheimes automatisch aus — **kein zweiter Datenspeicher, kein "if DM"-Spaghetti im App-Code.** Die ganze Asymmetrie lebt in einer Spalte.

## 5. 4-Wochen-Plan

Annahme: ~8–12 produktive Stunden/Woche pro Person, zwei Leute, Abende/Wochenende. Bei weniger Zeit eher 6–8 Wochen — kein Drama. **Jede Woche endet mit etwas Vorzeigbarem.** Rollen-Split ist ein Vorschlag (N = Niklas, F = Freund), gern tauschen.

### Woche 1 — Fundament & Rückgrat

**Ziel:** Eingeloggter User legt Kampagne an, zweiter User tritt per Link bei.

- N: Supabase-Projekt, komplettes Schema, Helfer + RLS (Membership), Auth (Magic Link oder Google)
- F: Next.js (App Router) + Tailwind + shadcn/ui, App-Shell/Nav, Screens "Kampagne anlegen" + "per Code beitreten", Vercel-Deploy ab Tag 1
- **Done:** Zwei echte Accounts teilen sich eine Kampagne, live deployed.

### Woche 2 — Der Herzschlag (Sessions + Quotes)

**Ziel:** Direkt nach einem Spielabend lässt sich alles erfassen, und es fühlt sich gut an.

- N: Session- + Quote-Daten/Server-Actions, Timeline-Query
- F: Session anlegen/auflisten, schlichter Markdown-Editor (Textarea + Render, **keine** Fancy-Lösung), Quote-UI, Session-Detail, Kampagnen-Timeline
- **Done:** DM legt Session 1 an, schreibt Recap, fügt 3 Quotes hinzu — erscheint auf der Timeline.

### Woche 3 — Die Seele (Entities + Asymmetrie)

**Ziel:** Das Produkt wird es selbst. Hier liegt der Differenzierer.

- N: Sichtbarkeit per RLS scharf durchsetzen, Reveal-Logik, Log-Entries
- F: Entity-Karten (NPC/Ort/Fraktion), der Geheim/Geteilt-Toggle für den DM, das Rendering der **Spieler-Sicht**, private Notizen
- **Done:** DM legt einen geheimen NPC an, "revealt" ihn in Session 4 — der Spieler-Account sieht ihn erst danach, inkl. Timeline-Eintrag.

### Woche 4 — Echt machen & in Hände geben

**Ziel:** Benutzbar genug für eine reale Runde + erste externe Tester.

- Beide: zwei Sichten polieren, Empty States, "Spieler einladen"-Flow, Responsive-Pass (am Tisch auf dem Handy bedienbar), Demo-Daten, Top-10-Jank fixen
- **Kritisch:** **deine eigene Runde** spielt eine echte Session damit; parallel ein Landing-One-Pager + ein kurzer Post in r/DnD / passenden Discords, um 3–5 weitere DMs anzufixen
- **Done:** Mindestens eine reale Runde nutzt es aktiv; Tester-Pipeline steht.

## 6. Definition of Done (v1) & Leitplanken

**v1 ist fertig, wenn** ein DM eine Kampagne anlegen, Spieler per Link einladen, eine Session mit Recap/Quotes/Momenten erfassen, Dinge geheim halten und enthüllen kann — und Spieler die geteilte Chronik plus eigene Notizen sehen. Mehr nicht.

**Nicht bauen, bis …**

- … der Nordstern erreicht ist (DM ≥2 Sessions am Stück; ≥1 Spieler-Login zwischen Sessions).
- Erst **dann** über Graph-Viz, Realtime oder Paywall nachdenken.

**Stack (schlank, dein Terrain):** Next.js (App Router) · Supabase (Postgres + Auth + RLS + Storage für Bilder) · Vercel · Tailwind + shadcn/ui (passt zu dark/angular/minimal mit Sage-Akzent). Realtime bewusst **aus**.
