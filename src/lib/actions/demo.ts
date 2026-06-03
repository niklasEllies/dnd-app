"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

/**
 * Seed a fully-populated demo campaign for the caller (as DM) so a new user
 * immediately sees what the product feels like. Uses the normal RLS-gated
 * inserts (the caller is the DM after create_campaign), then redirects to it.
 */
export async function createDemoCampaignAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const uid = user.id;

  const { data: campaign, error: cErr } = await supabase.rpc("create_campaign", {
    p_name: "Demo: The Sunless Citadel",
    p_system: "D&D 5e",
    p_description:
      "A starter chronicle showing how Campaign Memory feels. Poke around, then delete it anytime.",
  });
  if (cErr) return { error: cErr.message };
  const camp = Array.isArray(campaign) ? campaign[0] : campaign;
  if (!camp?.id) return { error: "Could not create the demo campaign." };
  const cid = camp.id as string;

  const { data: sessions } = await supabase
    .from("sessions")
    .insert([
      {
        campaign_id: cid,
        number: 1,
        title: "Into the Ravine",
        created_by: uid,
        recap:
          "The party descended into the **Sunless Citadel** and met *Meepo*, a grief-stricken kobold who lost his dragon.\n\n- Struck an uneasy deal with Meepo\n- Found the twig-blight infestation\n- Cliffhanger: a door sealed with old magic",
      },
      {
        campaign_id: cid,
        number: 2,
        title: "The Gulthias Tree",
        created_by: uid,
        recap:
          "Deeper in, the party reached the **Gulthias Tree**.\n\n> \"We don't negotiate with topiary.\"",
      },
    ])
    .select("id, number");
  const session1 = sessions?.find((s) => s.number === 1)?.id ?? null;

  await supabase.from("entities").insert([
    {
      campaign_id: cid,
      type: "npc",
      name: "Meepo",
      summary: "A kobold who lost his dragon to the goblins.",
      status: "alive",
      visibility: "shared",
      created_by: uid,
      notes: "Comic relief — until he isn't. Desperately wants Calcryx back.",
    },
    {
      campaign_id: cid,
      type: "location",
      name: "The Sunless Citadel",
      summary: "A fortress that sank into a ravine an age ago.",
      visibility: "shared",
      created_by: uid,
    },
    {
      campaign_id: cid,
      type: "faction",
      name: "Cult of the Gulthias Tree",
      summary: "Tends the blighted tree far below.",
      visibility: "secret",
      created_by: uid,
      notes:
        "SECRET: Belak the Outcast leads them. Reveal this card when the party finds the grove.",
    },
  ]);

  await supabase.from("quotes").insert([
    { campaign_id: cid, session_id: session1, body: "I attack the darkness.", speaker: "Tarn", created_by: uid },
    { campaign_id: cid, session_id: session1, body: "Meepo trusts you. Meepo always regrets trusting.", speaker: "Meepo", created_by: uid },
    { campaign_id: cid, session_id: null, body: "That's not a door. That's a face.", speaker: "Lia", created_by: uid },
  ]);

  await supabase.from("log_entries").insert([
    { campaign_id: cid, session_id: session1, type: "milestone", body: "The party entered the Sunless Citadel.", visibility: "shared", created_by: uid },
    { campaign_id: cid, session_id: session1, type: "decision", body: "Sided with the kobolds over the goblins.", visibility: "shared", created_by: uid },
  ]);

  revalidatePath("/dashboard");
  redirect(`/campaigns/${cid}`);
}
