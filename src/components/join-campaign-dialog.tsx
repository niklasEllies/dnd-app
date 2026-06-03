"use client";

import { useActionState, useState } from "react";
import { joinCampaignAction, type ActionState } from "@/lib/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function JoinCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    joinCampaignAction,
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Join</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a campaign</DialogTitle>
          <DialogDescription>
            Paste the invite code your DM shared with you.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite_code">Invite code</Label>
            <Input
              id="invite_code"
              name="invite_code"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. 3f9a1c2b8d4e"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="join_character_name">
              Your character <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="join_character_name" name="character_name" placeholder="e.g. Karlach" />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Joining…" : "Join campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
