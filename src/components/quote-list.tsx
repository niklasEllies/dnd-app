import { deleteQuoteAction } from "@/lib/actions/quotes";
import { SubmitButton } from "@/components/submit-button";

export type QuoteRow = {
  id: string;
  body: string;
  speaker: string | null;
  created_by: string | null;
  session_id: string | null;
};

export function QuoteList({
  quotes,
  campaignId,
  currentUserId,
  isDm,
}: {
  quotes: QuoteRow[];
  campaignId: string;
  currentUserId: string | undefined;
  isDm: boolean;
}) {
  if (quotes.length === 0) {
    return <p className="text-sm text-muted-foreground">No quotes yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((q) => {
        const canDelete = isDm || (!!currentUserId && q.created_by === currentUserId);
        return (
          <li key={q.id} className="rounded-md border bg-card p-3">
            <blockquote className="text-sm leading-relaxed">
              &ldquo;{q.body}&rdquo;
            </blockquote>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {q.speaker ? `— ${q.speaker}` : "— unattributed"}
              </span>
              {canDelete && (
                <form action={deleteQuoteAction}>
                  <input type="hidden" name="campaign_id" value={campaignId} />
                  <input type="hidden" name="quote_id" value={q.id} />
                  {q.session_id && (
                    <input type="hidden" name="session_id" value={q.session_id} />
                  )}
                  <SubmitButton
                    variant="ghost"
                    size="sm"
                    pendingLabel="Deleting…"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete quote${q.speaker ? `: ${q.speaker}` : ""}`}
                  >
                    Delete
                  </SubmitButton>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
