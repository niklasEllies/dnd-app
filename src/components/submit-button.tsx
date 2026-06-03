"use client";

import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Submit button for plain <form action={serverAction}> usage. Reads the form's
 * pending state via useFormStatus so the button disables + relabels while the
 * action runs (no useActionState needed). Must be rendered inside the <form>.
 */
export function SubmitButton({
  children,
  pendingLabel = "Working…",
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
