"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

/**
 * Add a quote. RLS allows any member to insert as themselves
 * (WITH CHECK is_member AND created_by = auth.uid()). The DB also enforces that
 * an attached session belongs to this campaign (trigger, migration 0011); we
 * pre-check here for a friendly message. Defaults to visibility 'shared'.
 */
export async function addQuoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  const speaker = String(formData.get("speaker") ?? "").trim() || null;

  if (!body) return { error: "A quote needs some words." };

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

  const { error } = await supabase.from("quotes").insert({
    campaign_id: campaignId,
    session_id: sessionId,
    body,
    speaker,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}`);
  if (sessionId) revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
  return null;
}

/** Delete a quote. RLS allows the author or the DM. Used as a plain form action. */
export async function deleteQuoteAction(formData: FormData): Promise<void> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;
  const quoteId = String(formData.get("quote_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
  // An RLS-denied delete is a silent 0-row no-op; this only catches real errors.
  if (error) console.error("deleteQuoteAction failed", error);

  revalidatePath(`/campaigns/${campaignId}`);
  if (sessionId) revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}
