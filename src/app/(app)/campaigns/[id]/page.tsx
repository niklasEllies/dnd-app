import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CopyInvite } from "@/components/copy-invite";
import { NewSessionDialog } from "@/components/new-session-dialog";
import { AddQuoteForm } from "@/components/add-quote-form";
import { QuoteList, type QuoteRow } from "@/components/quote-list";
import { SetCharacterName } from "@/components/set-character-name";
import { CampaignNav } from "@/components/campaign-nav";
import { LocalDate } from "@/components/local-date";
import { initials } from "@/lib/initials";

type Member = {
  role: string;
  character_name: string | null;
  user_id: string;
  profile: { display_name: string; avatar_url: string | null } | null;
};

type SessionRow = {
  id: string;
  number: number | null;
  title: string | null;
  played_on: string | null;
};

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, system, description, dm_id, invite_code")
    .eq("id", id)
    .single();

  // RLS denies non-members -> no row -> 404 (we never leak existence).
  if (!campaign) notFound();

  const isDm = campaign.dm_id === user?.id;

  const { data: memberData } = await supabase
    .from("campaign_members")
    .select("role, character_name, user_id, profile:profiles(display_name, avatar_url)")
    .eq("campaign_id", id)
    .order("joined_at", { ascending: true });
  const members = (memberData ?? []) as Member[];
  const me = members.find((m) => m.user_id === user?.id);

  const { data: sessionData } = await supabase
    .from("sessions")
    .select("id, number, title, played_on")
    .eq("campaign_id", id)
    .order("number", { ascending: true, nullsFirst: false })
    .order("played_on", { ascending: true, nullsFirst: false });
  const sessions = (sessionData ?? []) as SessionRow[];

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("id, body, speaker, created_by, session_id")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(8);
  const quotes = (quoteData ?? []) as QuoteRow[];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          {campaign.system && <Badge variant="secondary">{campaign.system}</Badge>}
          {isDm && <Badge>You are the DM</Badge>}
        </div>
        {campaign.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {campaign.description}
          </p>
        )}
        {me && <SetCharacterName campaignId={id} current={me.character_name} />}
      </div>

      <CampaignNav campaignId={id} active="overview" />

      {isDm && campaign.invite_code && (
        <div className="mt-8 rounded-md border bg-card p-5">
          <h2 className="text-sm font-semibold">Invite your players</h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">
            Share this code. Players enter it under “Join” on their dashboard.
          </p>
          <CopyInvite code={campaign.invite_code} />
        </div>
      )}

      <Separator className="my-8" />

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">
            Sessions{" "}
            <span className="font-normal text-muted-foreground">({sessions.length})</span>
          </h2>
          {isDm && (
            <NewSessionDialog
              campaignId={id}
              nextNumber={sessions.reduce((m, s) => Math.max(m, s.number ?? 0), 0) + 1}
            />
          )}
        </div>
        {sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No sessions yet.
            {isDm
              ? " Create the first one to start the chronicle — then add NPCs and places under Cards; they stay secret until you reveal them."
              : ""}
          </p>
        ) : (
          <ol className="mt-4 flex flex-col gap-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/campaigns/${id}/sessions/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 transition-colors hover:border-primary/60"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium">
                      {s.number != null ? `Session ${s.number}` : "Session"}
                    </span>
                    {s.title && (
                      <span className="text-sm text-muted-foreground">{s.title}</span>
                    )}
                  </span>
                  {s.played_on && (
                    <span className="text-xs text-muted-foreground">
                      <LocalDate iso={s.played_on} dateOnly />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="text-sm font-semibold">Quotes</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Anyone at the table can pin a line. Attach quotes to a session from its page.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <AddQuoteForm campaignId={id} />
          <QuoteList
            quotes={quotes}
            campaignId={id}
            currentUserId={user?.id}
            isDm={isDm}
          />
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="text-sm font-semibold">
          Table{" "}
          <span className="font-normal text-muted-foreground">({members.length})</span>
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {members.map((m) => {
            const name = m.profile?.display_name ?? "Unknown";
            return (
              <li key={m.user_id} className="flex items-center gap-3">
                <Avatar className="size-8">
                  {m.profile?.avatar_url ? (
                    <AvatarImage src={m.profile.avatar_url} alt={name} />
                  ) : null}
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{name}</span>
                  {m.character_name && (
                    <span className="text-xs text-muted-foreground">
                      as {m.character_name}
                    </span>
                  )}
                </div>
                <Badge
                  variant={m.role === "dm" ? "default" : "secondary"}
                  className="ml-auto"
                >
                  {m.role === "dm" ? "DM" : "Player"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
