"use client";

import { useActionState, useEffect, useRef } from "react";
import { addLogEntryAction, type ActionState } from "@/lib/actions/log";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selectClassName } from "@/lib/utils";

export function AddMomentForm({ campaignId }: { campaignId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addLogEntryAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state === null) formRef.current?.reset();
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-md border bg-card p-4"
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="moment-type">Type</Label>
          <select id="moment-type" name="type" defaultValue="milestone" className={selectClassName}>
            <option value="milestone">Milestone</option>
            <option value="decision">Decision</option>
            <option value="death">Death</option>
            <option value="loot">Loot</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="moment-vis">Visibility</Label>
          <select id="moment-vis" name="visibility" defaultValue="shared" className={selectClassName}>
            <option value="shared">Shared with players</option>
            <option value="secret">Secret (DM only)</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="moment-body">What happened</Label>
        <Textarea
          id="moment-body"
          name="body"
          rows={2}
          required
          placeholder="The party sided with the Harpers."
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add moment"}
        </Button>
      </div>
    </form>
  );
}
