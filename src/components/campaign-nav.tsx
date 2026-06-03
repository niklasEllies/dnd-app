import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", path: "" },
  { key: "entities", label: "Cards", path: "/entities" },
  { key: "timeline", label: "Timeline", path: "/timeline" },
] as const;

export function CampaignNav({
  campaignId,
  active,
}: {
  campaignId: string;
  active: "overview" | "entities" | "timeline";
}) {
  return (
    <nav className="mt-6 flex gap-1 border-b">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/campaigns/${campaignId}${t.path}`}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
            active === t.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
