import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav
        displayName={profile?.display_name?.trim() || user.email || "You"}
        email={user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
