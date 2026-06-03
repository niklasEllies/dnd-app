import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignNav } from "@/components/campaign-nav";
import { AddMomentForm } from "@/components/add-moment-form";
import { TimelineList, type LogRow } from "@/components/timeline-list";

export default async function TimelinePage({
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
    .select("id, name, dm_id")
    .eq("id", id)
    .single();
  if (!campaign) notFound();
  const isDm = campaign.dm_id === user?.id;

  const { data: logData } = await supabase
    .from("log_entries")
    .select("id, type, body, visibility, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });
  const entries = (logData ?? []) as LogRow[];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
      <CampaignNav campaignId={id} active="timeline" />

      <h2 className="mt-8 text-sm font-semibold">Timeline</h2>
      <div className="mt-4 flex flex-col gap-6">
        {isDm && <AddMomentForm campaignId={id} />}
        <TimelineList entries={entries} isDm={isDm} />
      </div>
    </main>
  );
}
