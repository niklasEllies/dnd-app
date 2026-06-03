"use client";

import { useActionState, useState } from "react";
import { saveEntityNoteAction, type ActionState } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PrivateNoteEditor({
  campaignId,
  entityId,
  initial,
}: {
  campaignId: string;
  entityId: string;
  initial: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveEntityNoteAction,
    null,
  );
  const [value, setValue] = useState(initial ?? "");
  const [seen, setSeen] = useState(initial);

  // Re-sync the draft when the persisted note changes (adjust-state-on-prop-change).
  if (initial !== seen) {
    setSeen(initial);
    setValue(initial ?? "");
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="entity_id" value={entityId} />
      <Textarea
        name="body"
        aria-label="Your private note"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Only you can see this…"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Private — only you can read this.
        </span>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
