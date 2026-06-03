"use client";

import { useActionState, useEffect, useRef } from "react";
import { addQuoteAction, type ActionState } from "@/lib/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AddQuoteForm({
  campaignId,
  sessionId,
}: {
  campaignId: string;
  sessionId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addQuoteAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Clear the fields after a settled, successful add (avoids accidental dupes).
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
      {sessionId && <input type="hidden" name="session_id" value={sessionId} />}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quote-body">Quote</Label>
        <Textarea
          id="quote-body"
          name="body"
          rows={2}
          required
          placeholder="“I attack the darkness.”"
        />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="quote-speaker">
            Speaker <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id="quote-speaker" name="speaker" placeholder="Karlach" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add quote"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
