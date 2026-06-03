"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyInvite({ code }: { code: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  async function copy(kind: "link" | "code") {
    const text =
      kind === "link" ? `${window.location.origin}/join?code=${code}` : code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === "link" ? "Invite link copied" : "Invite code copied");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy — select and copy it manually.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-sm border bg-muted px-2 py-1 font-mono text-sm break-all">
        {code}
      </code>
      <Button size="sm" onClick={() => copy("link")}>
        {copied === "link" ? "Copied" : "Copy invite link"}
      </Button>
      <Button variant="outline" size="sm" onClick={() => copy("code")}>
        {copied === "code" ? "Copied" : "Copy code"}
      </Button>
    </div>
  );
}
