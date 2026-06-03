"use client";

import { useActionState, useEffect, useRef, useState, type ReactElement } from "react";
import {
  createEntityAction,
  updateEntityAction,
  type ActionState,
} from "@/lib/actions/entities";
import { selectClassName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EntityForEdit = {
  id: string;
  name: string;
  summary: string | null;
  notes: string | null;
  status: string | null;
};

export function EntityDialog({
  campaignId,
  entity,
  trigger,
}: {
  campaignId: string;
  entity?: EntityForEdit;
  trigger?: ReactElement;
}) {
  const editing = !!entity;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    editing ? updateEntityAction : createEntityAction,
    null,
  );
  const wasPending = useRef(false);

  // Close the dialog after a settled, successful EDIT (create redirects instead).
  useEffect(() => {
    if (editing && wasPending.current && !pending && state === null) setOpen(false);
    wasPending.current = pending;
  }, [editing, pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button>New card</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit card" : "New card"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this card."
              : "NPCs, locations, factions — a one-line card, not a wiki page."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="campaign_id" value={campaignId} />
          {editing && <input type="hidden" name="entity_id" value={entity.id} />}

          {!editing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Type</Label>
                <select id="type" name="type" defaultValue="npc" className={selectClassName}>
                  <option value="npc">NPC</option>
                  <option value="location">Location</option>
                  <option value="faction">Faction</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="visibility">Visibility</Label>
                <select id="visibility" name="visibility" defaultValue="secret" className={selectClassName}>
                  <option value="secret">Secret (DM only)</option>
                  <option value="shared">Shared with players</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={entity?.name ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="summary">
              Summary <span className="text-muted-foreground">(one line)</span>
            </Label>
            <Input
              id="summary"
              name="summary"
              defaultValue={entity?.summary ?? ""}
              placeholder="A scarred mercenary with a debt"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" defaultValue={entity?.status ?? ""} className={selectClassName}>
              <option value="">—</option>
              <option value="alive">Alive</option>
              <option value="dead">Dead</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="text-muted-foreground">
                — players see these once the card is revealed (markdown)
              </span>
            </Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={entity?.notes ?? ""} />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save card" : "Create card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
