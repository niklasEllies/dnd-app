import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const TYPE_LABEL: Record<string, string> = {
  npc: "NPC",
  location: "Location",
  faction: "Faction",
};

export type EntityCardData = {
  id: string;
  type: string;
  name: string;
  summary: string | null;
  status: string | null;
  visibility: string;
};

export function EntityCard({
  entity,
  campaignId,
  isDm,
}: {
  entity: EntityCardData;
  campaignId: string;
  isDm: boolean;
}) {
  return (
    <Link
      href={`/campaigns/${campaignId}/entities/${entity.id}`}
      className="flex h-full flex-col gap-2 rounded-md border bg-card p-4 transition-colors hover:border-primary/60"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {TYPE_LABEL[entity.type] ?? entity.type}
        </span>
        <div className="flex items-center gap-1.5">
          {entity.status && <Badge variant="secondary">{entity.status}</Badge>}
          {/* Players only ever receive shared rows, so the flag is DM-only signal. */}
          {isDm && (
            <Badge variant={entity.visibility === "secret" ? "outline" : "default"}>
              {entity.visibility === "secret" ? "Secret" : "Shared"}
            </Badge>
          )}
        </div>
      </div>
      <h3 className="font-medium">{entity.name}</h3>
      {entity.summary && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{entity.summary}</p>
      )}
    </Link>
  );
}
