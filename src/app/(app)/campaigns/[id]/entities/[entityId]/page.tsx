import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/markdown";
import { EntityDialog } from "@/components/entity-dialog";
import { PrivateNoteEditor } from "@/components/private-note-editor";
import { SubmitButton } from "@/components/submit-button";
import { revealEntityAction, hideEntityAction } from "@/lib/actions/entities";

const TYPE_LABEL: Record<string, string> = {
  npc: "NPC",
  location: "Location",
  faction: "Faction",
};

export default async function EntityPage({
  params,
}: {
  params: Promise<{ id: string; entityId: string }>;
}) {
  const { id, entityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entity } = await supabase
    .from("entities")
    .select("id, campaign_id, type, name, summary, notes, status, visibility")
    .eq("id", entityId)
    .single();

  // 404 for non-members, players on a still-secret card, or wrong campaign.
  if (!entity || entity.campaign_id !== id) notFound();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, dm_id")
    .eq("id", id)
    .single();
  const isDm = !!campaign && campaign.dm_id === user?.id;
  const isSecret = entity.visibility === "secret";

  let note: string | null = null;
  if (user) {
    const { data: n } = await supabase
      .from("private_notes")
      .select("body")
      .eq("author_id", user.id)
      .eq("entity_id", entityId)
      .maybeSingle();
    note = n?.body ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href={`/campaigns/${id}/entities`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Cards
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {TYPE_LABEL[entity.type] ?? entity.type}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{entity.name}</h1>
        {entity.status && <Badge variant="secondary">{entity.status}</Badge>}
        {isDm && <Badge variant={isSecret ? "outline" : "default"}>{isSecret ? "Secret" : "Shared"}</Badge>}
      </div>
      {entity.summary && <p className="mt-2 text-muted-foreground">{entity.summary}</p>}

      {isDm && (
        <div className="mt-5 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <EntityDialog
              campaignId={id}
              entity={{
                id: entity.id,
                name: entity.name,
                summary: entity.summary,
                notes: entity.notes,
                status: entity.status,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            {isSecret ? (
              <form action={revealEntityAction}>
                <input type="hidden" name="campaign_id" value={id} />
                <input type="hidden" name="entity_id" value={entity.id} />
                <SubmitButton size="sm" pendingLabel="Revealing…">
                  Reveal to players
                </SubmitButton>
              </form>
            ) : (
              <form action={hideEntityAction}>
                <input type="hidden" name="campaign_id" value={id} />
                <input type="hidden" name="entity_id" value={entity.id} />
                <SubmitButton size="sm" variant="ghost" pendingLabel="Hiding…">
                  Hide from players
                </SubmitButton>
              </form>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isSecret
              ? "Players can't see this card yet. Revealing shares its name, summary, and notes — and drops a moment on the timeline."
              : "Players can see this card. Hiding removes it from their view (and the reveal moment), but they may already have seen it."}
          </p>
        </div>
      )}

      <Separator className="my-6" />
      <section>
        <h2 className="mb-2 text-sm font-semibold">Notes</h2>
        {isDm && (
          <p className="mb-2 text-xs text-muted-foreground">
            Players see these once the card is revealed.
          </p>
        )}
        {entity.notes?.trim() ? (
          <Markdown>{entity.notes}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">No notes.</p>
        )}
      </section>

      <Separator className="my-6" />
      <section>
        <h2 className="mb-2 text-sm font-semibold">Your private note</h2>
        <PrivateNoteEditor campaignId={id} entityId={entityId} initial={note} />
      </section>
    </main>
  );
}
