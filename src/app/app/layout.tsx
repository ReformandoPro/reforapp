import { redirect } from "next/navigation";

import { PrivateAppShell } from "@/components/layout/PrivateAppShell";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app");
  }
  return <PrivateAppShell>{children}</PrivateAppShell>;
}

