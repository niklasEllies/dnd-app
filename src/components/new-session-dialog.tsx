"use client";

import { useActionState, useState } from "react";
import { createSessionAction, type ActionState } from "@/lib/actions/sessions";
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

export function NewSessionDialog({
  campaignId,
  nextNumber,
}: {
  campaignId: string;
  nextNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createSessionAction,
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>New session</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New session</DialogTitle>
          <DialogDescription>
            Log a session. Players can see it as soon as you create it — don&apos;t
            draft secrets in the recap. Write it now or later.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="campaign_id" value={campaignId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="number">Number</Label>
              <Input id="number" name="number" type="number" min={0} defaultValue={nextNumber} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="played_on">Date</Label>
              <Input id="played_on" name="played_on" type="date" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">
              Title <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="title" name="title" placeholder="The Death House" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="recap">
              Recap <span className="text-muted-foreground">(markdown, optional)</span>
            </Label>
            <Textarea id="recap" name="recap" rows={5} placeholder="What happened…" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
