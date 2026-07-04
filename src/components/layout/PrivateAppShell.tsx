import Link from "next/link";

import { logout } from "@/app/login/actions";

const navigationItems = [
  { href: "/app", label: "Panel", description: "Vista general" },
  { href: "/app/projects", label: "Obras", description: "Proyectos y producción" },
  { href: "/app/clients", label: "Clientes", description: "Contactos y expedientes" },
  { href: "/app/team", label: "Equipo", description: "Miembros y roles" },
  { href: "/app/profile", label: "Mi perfil", description: "Datos personales" },
];

export function PrivateAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-raised text-content-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-subtle bg-bg-surface px-4 py-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/app" className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-content-tertiary">
                Reformando
              </span>
              <span className="mt-1 block text-lg font-semibold tracking-tight">
                Zona privada
              </span>
            </Link>
            <form action={logout} className="lg:hidden">
              <button type="submit" className="text-sm font-medium text-content-secondary hover:text-content-primary">
                Salir
              </button>
            </form>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-w-fit rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:border-subtle hover:bg-bg-raised hover:text-content-primary lg:px-4 lg:py-3"
              >
                <span className="block text-content-primary">{item.label}</span>
                <span className="hidden text-xs font-normal text-content-tertiary lg:block">
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-2xl border border-subtle bg-bg-raised p-4 lg:block">
            <p className="text-sm font-medium">MVP privado</p>
            <p className="mt-1 text-xs leading-5 text-content-secondary">
              Pantallas preparadas para conectar services/adapters con Supabase sin acoplar la UI.
            </p>
          </div>

          <form action={logout} className="mt-6 hidden lg:block">
            <button type="submit" className="text-sm font-medium text-content-secondary hover:text-content-primary">
              Salir
            </button>
          </form>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
