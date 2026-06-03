"use client";

import { useActionState } from "react";
import { setCharacterNameAction, type ActionState } from "@/lib/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetCharacterName({
  campaignId,
  current,
}: {
  campaignId: string;
  current: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    setCharacterNameAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
        <Label htmlFor="character_name" className="text-xs text-muted-foreground">
          Your character
        </Label>
        <Input
          id="character_name"
          name="character_name"
          defaultValue={current ?? ""}
          placeholder="e.g. Karlach"
          className="h-8"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="shrink-0">
        {pending ? "Saving…" : "Save"}
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
