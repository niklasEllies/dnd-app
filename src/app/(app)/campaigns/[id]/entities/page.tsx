import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignNav } from "@/components/campaign-nav";
import { EntityDialog } from "@/components/entity-dialog";
import { EntityCard, type EntityCardData } from "@/components/entity-card";

export default async function EntitiesPage({
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

  const { data: entityData } = await supabase
    .from("entities")
    .select("id, type, name, summary, status, visibility")
    .eq("campaign_id", id)
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  const entities = (entityData ?? []) as EntityCardData[];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
      <CampaignNav campaignId={id} active="entities" />

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            Cards <span className="font-normal text-muted-foreground">({entities.length})</span>
          </h2>
          {(isDm || entities.length > 0) && (
            <p className="text-sm text-muted-foreground">
              NPCs, locations, factions — lightweight cards, not wiki pages.
            </p>
          )}
        </div>
        {isDm && <EntityDialog campaignId={id} />}
      </div>

      {entities.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          {isDm
            ? "No cards yet. Create an NPC, location, or faction — keep it secret until the party finds out."
            : "Nothing has been shared with you yet. Cards appear here when the DM reveals them — usually after the session they turn up in."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => (
            <li key={e.id}>
              <EntityCard entity={e} campaignId={id} isDm={isDm} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
