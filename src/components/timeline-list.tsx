import { Badge } from "@/components/ui/badge";
import { LocalDate } from "@/components/local-date";

const TYPE_LABEL: Record<string, string> = {
  reveal: "Reveal",
  death: "Death",
  decision: "Decision",
  loot: "Loot",
  milestone: "Milestone",
  note: "Note",
};

export type LogRow = {
  id: string;
  type: string;
  body: string;
  visibility: string;
  created_at: string | null;
};

export function TimelineList({ entries, isDm }: { entries: LogRow[]; isDm: boolean }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isDm
          ? "Nothing on the timeline yet. Add a moment, or reveal a card to drop one here."
          : "Nothing here yet — the DM hasn't shared any moments. Check back after your next session."}
      </p>
    );
  }
  return (
    <ol className="relative flex flex-col gap-4 border-l pl-5">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span
            className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-primary"
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TYPE_LABEL[e.type] ?? e.type}</Badge>
            {isDm && e.visibility === "secret" && <Badge variant="outline">Secret</Badge>}
            {e.created_at && (
              <span className="text-xs text-muted-foreground">
                <LocalDate iso={e.created_at} />
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed">{e.body}</p>
        </li>
      ))}
    </ol>
  );
}
