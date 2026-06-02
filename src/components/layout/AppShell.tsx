import Link from "next/link";
import { ReactNode } from "react";

const navigationItems: Array<{
  label: string;
  href: string;
  active?: boolean;
}> = [
  { label: "Inicio", href: "/", active: true },
  { label: "Obras", href: "/projects" },
  { label: "Presupuestos", href: "/budgets" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base text-content-primary">
      <header className="sticky top-0 z-10 border-b border-subtle bg-bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-content-tertiary">Reformando.app</p>
          <h1 className="text-lg font-semibold text-content-primary">Gestión integral de reformas</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:px-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-subtle bg-bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2 sm:px-6 lg:px-8">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                item.active
                  ? "text-primary-300"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}

          <span
            aria-disabled="true"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-content-tertiary sm:text-sm"
          >
            <span>Equipo</span>
          </span>
        </div>
      </nav>
    </div>
  );
}
