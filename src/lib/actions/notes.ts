"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

/**
 * Save (or clear) the caller's own private note on an entity. Author-only via
 * RLS. One note per (author, entity) is guaranteed by a unique index (0013), so
 * this is a race-free upsert. An empty body deletes the note.
 */
export async function saveEntityNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!body) {
    await supabase
      .from("private_notes")
      .delete()
      .eq("author_id", user.id)
      .eq("entity_id", entityId);
    revalidatePath(`/campaigns/${campaignId}/entities/${entityId}`);
    return null;
  }

  const { error } = await supabase.from("private_notes").upsert(
    { campaign_id: campaignId, entity_id: entityId, author_id: user.id, body },
    { onConflict: "author_id,entity_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/campaigns/${campaignId}/entities/${entityId}`);
  return null;
}
