import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";

import { createClientAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo cliente</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para crear un cliente.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/app/clients"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a clientes
        </Link>
        <EmptyState title="Acceso denegado" description="No tienes permisos para crear clientes." />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/app/clients"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a clientes
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo cliente</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Crea un cliente dentro de tu organización.
        </p>

        <form action={createClientAction} className="mt-6 space-y-6">
          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="display_name">
              Nombre
            </label>
            <input
              id="display_name"
              name="display_name"
              required
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              placeholder="Ej: María García"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email (opcional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="phone">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                name="phone"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="address">
              Dirección (opcional)
            </label>
            <input
              id="address"
              name="address"
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="notes">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">La organización se deriva en servidor.</p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear cliente
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
