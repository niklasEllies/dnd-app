import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Recaps & quotes",
    body: "Write the session recap. Pin the lines nobody will forget. The chronicle builds itself, session by session.",
  },
  {
    title: "Secrets & reveals",
    body: "Mark NPCs, places, and moments secret. When the party finds out, one click reveals it — and it lands on their timeline.",
  },
  {
    title: "A player's view",
    body: "Players see only what's shared, plus their own private notes. A reason to log in between sessions.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Campaign Memory
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          The living memory of your table.
        </h1>
        <p className="max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
          Not another worldbuilding wiki. Capture what actually happened — the
          recaps, the quotes, the moment a secret dropped — and keep the
          DM&apos;s secrets secret until the reveal.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={user ? "/dashboard" : "/login"}
            className={buttonVariants({ size: "lg" })}
          >
            {user ? "Go to your campaigns" : "Start a campaign"}
          </Link>
          {!user && (
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Sign in
            </Link>
          )}
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold">{f.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
