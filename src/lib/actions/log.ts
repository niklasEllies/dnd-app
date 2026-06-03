"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

// 'reveal' is system-generated (via reveal_entity); the DM picks from the rest.
const TYPES = ["death", "decision", "loot", "milestone", "note"];
const VIS = ["secret", "shared"];

/** Add a timeline moment (DM-only via RLS). */
export async function addLogEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const visRaw = String(formData.get("visibility") ?? "");
  const visibility = VIS.includes(visRaw) ? visRaw : "shared";

  if (!TYPES.includes(type)) return { error: "Pick a moment type." };
  if (!body) return { error: "Describe the moment." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (sessionId) {
    const { data: sess } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("campaign_id", campaignId)
      .maybeSingle();
    if (!sess) return { error: "That session isn't part of this campaign." };
  }

  const { error } = await supabase.from("log_entries").insert({
    campaign_id: campaignId,
    session_id: sessionId,
    type,
    body,
    visibility,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}/timeline`);
  revalidatePath(`/campaigns/${campaignId}`);
  return null;
}
