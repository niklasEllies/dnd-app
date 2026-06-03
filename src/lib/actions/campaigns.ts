"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

/**
 * Create a campaign. Membership is set up atomically by the `create_campaign`
 * SECURITY DEFINER RPC, which makes the caller the DM. Redirects on success.
 */
export async function createCampaignAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const system = String(formData.get("system") ?? "").trim() || undefined;
  const description = String(formData.get("description") ?? "").trim() || undefined;

  if (!name) return { error: "Give your campaign a name." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_campaign", {
    p_name: name,
    p_system: system,
    p_description: description,
  });

  if (error) return { error: error.message };

  const campaign = Array.isArray(data) ? data[0] : data;
  if (!campaign?.id) return { error: "Could not create the campaign." };

  revalidatePath("/dashboard");
  redirect(`/campaigns/${campaign.id}`);
}

/**
 * Join a campaign by invite code via the `join_campaign` RPC (idempotent,
 * player-only, self-only). An optional character name is set on the membership.
 */
export async function joinCampaignAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const code = String(formData.get("invite_code") ?? "").trim();
  const character = String(formData.get("character_name") ?? "").trim() || undefined;
  if (!code) return { error: "Enter an invite code." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_campaign", {
    p_invite_code: code,
    p_character_name: character,
  });

  if (error) return { error: error.message };

  const campaign = Array.isArray(data) ? data[0] : data;
  if (!campaign?.id) {
    return { error: "That invite code didn't match a campaign." };
  }

  revalidatePath("/dashboard");
  redirect(`/campaigns/${campaign.id}`);
}

/**
 * Set the caller's own character name in a campaign. RLS + a column-scoped
 * UPDATE grant ensure a member can only touch their own `character_name`.
 */
export async function setCharacterNameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const name = String(formData.get("character_name") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("campaign_members")
    .update({ character_name: name || null })
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}`);
  return null;
}
