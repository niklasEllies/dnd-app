"use client";

import { useActionState } from "react";
import { createDemoCampaignAction, type ActionState } from "@/lib/actions/demo";
import { Button } from "@/components/ui/button";

export function DemoCampaignButton() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createDemoCampaignAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Conjuring a demo…" : "Try a demo campaign"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
