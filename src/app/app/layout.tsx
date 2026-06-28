import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/login/actions";
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
  return (
    <div className="min-h-screen">
      <header className="border-b border-subtle bg-bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm font-semibold">
              Reformando
            </Link>
            <nav className="flex items-center gap-3">
              <Link
                href="/app"
                className="text-sm font-medium text-content-secondary hover:text-content-primary"
              >
                Panel
              </Link>
              <Link
                href="/app/projects"
                className="text-sm font-medium text-content-secondary hover:text-content-primary"
              >
                Obras
              </Link>
              <Link
                href="/app/clients"
                className="text-sm font-medium text-content-secondary hover:text-content-primary"
              >
                Clientes
              </Link>
              <Link
                href="/app/team"
                className="text-sm font-medium text-content-secondary hover:text-content-primary"
              >
                Equipo
              </Link>
              <Link
                href="/app/profile"
                className="text-sm font-medium text-content-secondary hover:text-content-primary"
              >
                Mi perfil
              </Link>
            </nav>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-content-secondary hover:text-content-primary"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="px-4 py-8">{children}</main>
    </div>
  );
}

