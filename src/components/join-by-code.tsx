"use client";

import { useActionState } from "react";
import { joinCampaignAction, type ActionState } from "@/lib/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function JoinByCode({ initialCode }: { initialCode: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    joinCampaignAction,
    null,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Join a campaign</CardTitle>
        <CardDescription>
          You&apos;ve been invited. Confirm to join the table — and add your
          character name if you have one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite_code">Invite code</Label>
            <Input
              id="invite_code"
              name="invite_code"
              defaultValue={initialCode}
              required
              autoComplete="off"
              spellCheck={false}
              readOnly={!!initialCode}
              className={initialCode ? "bg-muted" : undefined}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="character_name">
              Your character <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="character_name" name="character_name" placeholder="e.g. Karlach" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Joining…" : "Join campaign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
