import { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 border-b border-b-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <h1 className="text-lg font-semibold">Reformando</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestión integral de reformas
        </p>
      </header>
      <main className="p-4">{children}</main>
      <nav className="sticky bottom-0 z-10 flex justify-around border-t border-t-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
        <a
          href="#"
          className="flex flex-col items-center gap-1 p-2 text-sm text-[var(--text-secondary)]"
        >
          <span>Inicio</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 p-2 text-sm text-[var(--text-secondary)]"
        >
          <span>Obras</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 p-2 text-sm text-[var(--text-secondary)]"
        >
          <span>Presupuestos</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 p-2 text-sm text-[var(--text-secondary)]"
        >
          <span>Equipo</span>
        </a>
      </nav>
    </div>
  );
}
