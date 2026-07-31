import Link from "next/link";

import { logout } from "@/app/login/actions";

const navigationItems = [
  { href: "/app", label: "Panel", description: "Vista general" },
  { href: "/app/projects", label: "Obras", description: "Producción" },
  { href: "/app/clients", label: "Clientes", description: "Expedientes" },
  { href: "/app/team", label: "Equipo", description: "Roles" },
  { href: "/app/profile", label: "Perfil", description: "Cuenta" },
];

export function PrivateAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-bg-base text-content-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(45,127,249,0.16),transparent_34rem),radial-gradient(circle_at_80%_0%,rgba(111,168,246,0.09),transparent_28rem)]" />

      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-bg-base/78 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/app" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-500 text-sm font-bold text-white shadow-primary">
              R
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5 text-content-primary">Reformando.app</span>
              <span className="block truncate text-xs text-content-tertiary">Gestión integral de reformas</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-white/[0.05] hover:text-content-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="whitespace-nowrap rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-white/[0.06] hover:text-content-primary"
            >
              Salir
            </button>
          </form>
        </div>

        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 sm:pb-4 lg:hidden">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-fit rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-white/[0.06] hover:text-content-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
