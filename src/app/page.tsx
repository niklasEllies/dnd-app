import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    numeral: "I",
    title: "Recaps & quotes",
    body: "Write the session recap in markdown. Pin the lines nobody will forget. The chronicle builds itself, evening by evening.",
  },
  {
    numeral: "II",
    title: "Secrets & reveals",
    body: "Keep NPCs, places, and factions sealed. When the party finds out, one click reveals them — and the moment is struck onto a shared timeline.",
  },
  {
    numeral: "III",
    title: "A player's view",
    body: "Players see only what's been shared, plus their own private notes. A reason to return between sessions.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2.5">
          <span className="relative inline-flex size-6 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_2px_var(--color-primary)]" />
          </span>
          <span className="font-display text-sm font-medium tracking-wide">Campaign Memory</span>
        </span>
        <Link
          href={user ? "/dashboard" : "/login"}
          className="font-display text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {user ? "Your campaigns" : "Sign in"}
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16 sm:py-24">
        <p
          className="rise font-display text-xs uppercase tracking-[0.42em] text-primary"
          style={{ animationDelay: "0ms" }}
        >
          A chronicle for your table
        </p>
        <h1
          className="rise mt-6 max-w-3xl text-balance text-5xl leading-[0.98] tracking-tight sm:text-7xl"
          style={{ animationDelay: "90ms" }}
        >
          The living memory
          <br />
          <span className="italic text-primary">of your table.</span>
        </h1>
        <p
          className="rise mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          style={{ animationDelay: "200ms" }}
        >
          Not a worldbuilding wiki — the warm, shared record of{" "}
          <em className="text-foreground/90">this</em> campaign. The recaps, the
          quotes, the night a secret finally broke its seal.
        </p>
        <div
          className="rise mt-9 flex flex-col gap-3 sm:flex-row"
          style={{ animationDelay: "320ms" }}
        >
          <Link
            href={user ? "/dashboard" : "/login"}
            className={cn(buttonVariants({ size: "lg" }), "shadow-[0_0_34px_-10px_var(--color-primary)]")}
          >
            {user ? "Open your chronicle" : "Begin the chronicle"}
          </Link>
          {!user && (
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Sign in
            </Link>
          )}
        </div>

        {/* Signature: the secret → reveal mechanic, shown not told. */}
        <div
          className="rise mt-16 grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5"
          style={{ animationDelay: "440ms" }}
        >
          <div className="rounded-md border border-dashed border-primary/30 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-2 rounded-full bg-muted-foreground/50" />
              Sealed
            </div>
            <p className="mt-3 font-display text-base text-muted-foreground/70 blur-[3px] select-none">
              Gravelthroat the Goblin
            </p>
            <p className="mt-1 text-xs text-muted-foreground/50 blur-[2px] select-none">
              Knows where the relic is buried.
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 text-primary">
            <span className="text-[0.6rem] uppercase tracking-[0.2em]">reveal</span>
            <span aria-hidden className="text-xl leading-none">
              →
            </span>
          </div>

          <div className="rounded-md border border-primary/50 bg-primary/5 p-4 shadow-[0_0_44px_-14px_var(--color-primary)]">
            <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-primary">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_10px_1px_var(--color-primary)]" />
              Revealed
            </div>
            <p className="mt-3 font-display text-base text-foreground">
              Gravelthroat the Goblin
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Knows where the relic is buried.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-primary/15 bg-card/30">
        <div className="mx-auto grid w-full max-w-5xl sm:grid-cols-3 sm:divide-x sm:divide-primary/10">
          {PILLARS.map((p, i) => (
            <article
              key={p.numeral}
              className="rise px-6 py-10 sm:px-8"
              style={{ animationDelay: `${560 + i * 90}ms` }}
            >
              <span aria-hidden className="font-display text-4xl italic text-primary/40">
                {p.numeral}
              </span>
              <h2 className="mt-3 text-lg">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-10">
        <p className="font-display text-sm italic text-muted-foreground">
          Not a wiki. A chronicle. — system-agnostic, free, and early.
        </p>
      </footer>
    </main>
  );
}
