import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { NewCampaignDialog } from "@/components/new-campaign-dialog";
import { JoinCampaignDialog } from "@/components/join-campaign-dialog";
import { DemoCampaignButton } from "@/components/demo-campaign-button";

type Membership = {
  role: string;
  character_name: string | null;
  campaign: {
    id: string;
    name: string;
    system: string | null;
    description: string | null;
    created_at: string;
  } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_members")
    .select(
      "role, character_name, campaign:campaigns(id, name, system, description, created_at)",
    )
    .order("joined_at", { ascending: false });

  // Surface real failures (e.g. an RLS/permission error) instead of silently
  // rendering an empty dashboard, which is indistinguishable from "no campaigns".
  if (error) throw new Error(`Failed to load campaigns: ${error.message}`);

  const memberships = ((data ?? []) as Membership[]).filter((m) => m.campaign);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Your tables and the chronicles you&apos;ve joined.
          </p>
        </div>
        <div className="flex gap-2">
          <JoinCampaignDialog />
          <NewCampaignDialog />
        </div>
      </div>

      {memberships.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-md border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No campaigns yet. Start one as the DM, join your table with an invite
            code, or take a demo for a spin.
          </p>
          <DemoCampaignButton />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {memberships.map((m) => (
            <li key={m.campaign!.id}>
              <Link
                href={`/campaigns/${m.campaign!.id}`}
                className="flex h-full flex-col gap-2 rounded-md border bg-card p-5 transition-colors hover:border-primary/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-medium">{m.campaign!.name}</h2>
                  <Badge variant={m.role === "dm" ? "default" : "secondary"}>
                    {m.role === "dm" ? "DM" : "Player"}
                  </Badge>
                </div>
                {m.campaign!.system && (
                  <p className="text-xs text-muted-foreground">
                    {m.campaign!.system}
                  </p>
                )}
                {m.campaign!.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {m.campaign!.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
