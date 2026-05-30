import type { ReactNode } from "react";

import { Badge } from "../ui/Badge";

type AppShellProps = {
  children: ReactNode;
};

const navigationItems = ["Dashboard", "Obra", "Presupuesto"];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reformando.app
              </p>
              <h1 className="text-xl font-semibold">Core y experiencia coordinados</h1>
            </div>
            <Badge tone="info">UI base temporal</Badge>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
