"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

const TYPES = ["npc", "location", "faction"];
const STATUSES = ["alive", "dead", "unknown"];
const VIS = ["secret", "shared"];

/** Create an entity (DM-only via RLS). Redirects to the new card. */
export async function createEntityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = STATUSES.includes(statusRaw) ? statusRaw : null;
  const visRaw = String(formData.get("visibility") ?? "");
  const visibility = VIS.includes(visRaw) ? visRaw : "secret";

  if (!TYPES.includes(type)) return { error: "Pick a type (NPC, location, or faction)." };
  if (!name) return { error: "Give the card a name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("entities")
    .insert({ campaign_id: campaignId, type, name, summary, notes, status, visibility, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}/entities`);
  redirect(`/campaigns/${campaignId}/entities/${data.id}`);
}

/** Edit an entity's content (DM-only). Visibility changes go through reveal/hide. */
export async function updateEntityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = STATUSES.includes(statusRaw) ? statusRaw : null;

  if (!name) return { error: "Give the card a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("entities")
    .update({ name, summary, notes, status })
    .eq("id", entityId);

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}/entities/${entityId}`);
  revalidatePath(`/campaigns/${campaignId}/entities`);
  return null;
}

/** Reveal an entity to players (DM-only). Flips secret->shared AND logs it (RPC). */
export async function revealEntityAction(formData: FormData): Promise<void> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reveal_entity", { p_entity_id: entityId });
  if (error) console.error("revealEntityAction failed", error);

  revalidatePath(`/campaigns/${campaignId}/entities/${entityId}`);
  revalidatePath(`/campaigns/${campaignId}/entities`);
  revalidatePath(`/campaigns/${campaignId}/timeline`);
}

/** Quietly make a shared entity secret again (DM-only; not logged). */
export async function hideEntityAction(formData: FormData): Promise<void> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");

  const supabase = await createClient();
  // RPC mirrors reveal_entity: flips to secret AND hides the reveal moment so the
  // player timeline doesn't keep leaking "<Name> was revealed.".
  const { error } = await supabase.rpc("hide_entity", { p_entity_id: entityId });
  if (error) console.error("hideEntityAction failed", error);

  revalidatePath(`/campaigns/${campaignId}/entities/${entityId}`);
  revalidatePath(`/campaigns/${campaignId}/entities`);
}
