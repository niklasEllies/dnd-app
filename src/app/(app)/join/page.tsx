import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinByCode } from "@/components/join-by-code";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already gates this, but be explicit: send guests through login
  // and back to the same invite link.
  if (!user) {
    const next = `/join${code ? `?code=${encodeURIComponent(code)}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <JoinByCode initialCode={code ?? ""} />
    </main>
  );
}
