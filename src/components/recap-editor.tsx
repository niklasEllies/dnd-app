"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateRecapAction, type ActionState } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";

export function RecapEditor({
  campaignId,
  sessionId,
  initialRecap,
}: {
  campaignId: string;
  sessionId: string;
  initialRecap: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialRecap ?? "");
  const [seenRecap, setSeenRecap] = useState(initialRecap);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateRecapAction,
    null,
  );
  const wasPending = useRef(false);

  // Re-sync the draft when the persisted recap changes (adjust-state-on-prop-change,
  // the recommended alternative to a setState-in-effect).
  if (initialRecap !== seenRecap) {
    setSeenRecap(initialRecap);
    setValue(initialRecap ?? "");
  }

  useEffect(() => {
    if (wasPending.current && !pending && state === null) {
      setEditing(false);
      toast.success("Recap saved");
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (!editing) {
    const recap = initialRecap?.trim();
    return (
      <div className="flex flex-col gap-3">
        {recap ? (
          <Markdown>{initialRecap as string}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">No recap yet.</p>
        )}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(initialRecap ?? "");
              setEditing(true);
            }}
          >
            {recap ? "Edit recap" : "Write recap"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="session_id" value={sessionId} />
      <Textarea
        name="recap"
        aria-label="Recap"
        rows={12}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="font-mono text-sm"
        placeholder="Markdown supported — # headings, **bold**, - lists…"
      />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save recap"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setValue(initialRecap ?? "");
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
      <div className="rounded-md border bg-muted/30 p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          Preview
        </p>
        {value.trim() ? (
          <Markdown>{value}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing to preview.</p>
        )}
      </div>
    </form>
  );
}
