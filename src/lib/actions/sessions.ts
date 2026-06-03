"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

/**
 * Create a session. RLS enforces DM-only (insert WITH CHECK is_dm AND
 * created_by = auth.uid()), so a non-DM attempt fails here rather than in the UI.
 * Redirects to the new session on success.
 */
export async function createSessionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const title = String(formData.get("title") ?? "").trim() || null;
  const numberRaw = String(formData.get("number") ?? "").trim();
  const playedOn = String(formData.get("played_on") ?? "").trim() || null;
  const recap = String(formData.get("recap") ?? "").trim() || null;

  let number: number | null = null;
  if (numberRaw) {
    number = Number(numberRaw);
    if (!Number.isInteger(number) || number < 0) {
      return { error: "Session number must be a non-negative whole number." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      campaign_id: campaignId,
      title,
      number,
      played_on: playedOn,
      recap,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}/sessions/${data.id}`);
}

/** Update a session's recap (DM-only via RLS). */
export async function updateRecapAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const recap = String(formData.get("recap") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ recap: recap.trim() || null })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
  return null;
}
