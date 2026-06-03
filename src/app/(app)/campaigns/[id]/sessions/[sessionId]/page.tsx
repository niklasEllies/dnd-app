import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/markdown";
import { RecapEditor } from "@/components/recap-editor";
import { AddQuoteForm } from "@/components/add-quote-form";
import { QuoteList, type QuoteRow } from "@/components/quote-list";
import { LocalDate } from "@/components/local-date";

type SessionDetail = {
  id: string;
  campaign_id: string;
  number: number | null;
  title: string | null;
  played_on: string | null;
  recap: string | null;
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, campaign_id, number, title, played_on, recap")
    .eq("id", sessionId)
    .single();

  // 404 for non-members (RLS) or a session that isn't in this campaign.
  if (!session || session.campaign_id !== id) notFound();
  const s = session as SessionDetail;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, dm_id")
    .eq("id", id)
    .single();
  const isDm = !!campaign && campaign.dm_id === user?.id;

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("id, body, speaker, created_by, session_id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  const quotes = (quoteData ?? []) as QuoteRow[];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href={`/campaigns/${id}`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {campaign?.name ?? "Campaign"}
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {s.number != null ? `Session ${s.number}` : "Session"}
        </h1>
        {s.title && <span className="text-lg text-muted-foreground">{s.title}</span>}
        {s.played_on && (
          <span className="ml-auto text-xs text-muted-foreground">
            <LocalDate iso={s.played_on} dateOnly />
          </span>
        )}
      </div>

      <Separator className="my-6" />

      <section>
        <h2 className="mb-3 text-sm font-semibold">Recap</h2>
        {isDm ? (
          <RecapEditor campaignId={id} sessionId={sessionId} initialRecap={s.recap} />
        ) : s.recap?.trim() ? (
          <Markdown>{s.recap}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">
            The DM hasn&apos;t written this recap yet.
          </p>
        )}
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="text-sm font-semibold">
          Quotes from this session{" "}
          <span className="font-normal text-muted-foreground">({quotes.length})</span>
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <QuoteList
            quotes={quotes}
            campaignId={id}
            currentUserId={user?.id}
            isDm={isDm}
          />
          <AddQuoteForm campaignId={id} sessionId={sessionId} />
        </div>
      </section>
    </main>
  );
}
