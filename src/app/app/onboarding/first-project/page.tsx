import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { createFirstProjectFromOnboardingAction } from "./actions";

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  display_name: string;
};

export default async function FirstProjectOnboardingPage({
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Crear tu primera obra</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para continuar.
          </p>
          <div className="mt-4">
            <Link
              href="/login?redirectTo=/app/onboarding/first-project"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Ir a login
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/app/onboarding"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver al onboarding
        </Link>

        <EmptyState
          title="Solo lectura"
          description="Pide a un administrador que cree la primera obra."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", ctx.organizationId)
    .order("display_name");

  const clientRows = ((clients ?? []) as ClientRow[]) ?? [];

  const { count: projectsCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.organizationId);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/app/onboarding"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver al onboarding
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Crear tu primera obra</h1>
          <p className="text-sm text-[var(--text-secondary)] sm:text-base">
            Te guiamos con lo mínimo: datos de obra y cliente.
          </p>
        </div>

        {typeof projectsCount === "number" && projectsCount > 0 ? (
          <p className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            Ya tienes obras creadas, pero puedes crear otra desde este asistente.
          </p>
        ) : null}

        <form action={createFirstProjectFromOnboardingAction} className="mt-6 space-y-6">
          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Datos de obra</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                name="address"
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="type">
                Tipo
              </label>
              <input
                id="type"
                name="type"
                required
                placeholder="Ej: Reforma integral"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Cliente</h2>

            {clientsError ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No pudimos cargar clientes. Inténtalo de nuevo.
              </p>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="clientId">
                Cliente existente
              </label>
              <select
                id="clientId"
                name="clientId"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                defaultValue=""
              >
                <option value="">— Selecciona un cliente —</option>
                {clientRows.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.display_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-tertiary)]">
                Debes seleccionar un cliente o crear uno nuevo.
              </p>
            </div>

            <details className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Crear cliente rápido
              </summary>
              <div className="mt-4 space-y-4">
                <input type="hidden" name="quickClientEnabled" value="" />
                <div className="flex items-center gap-2">
                  <input id="quickClientEnabled" name="quickClientEnabled" type="checkbox" className="h-4 w-4" />
                  <label htmlFor="quickClientEnabled" className="text-sm">
                    Crear un cliente nuevo ahora
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="quickClientDisplayName">
                      Nombre del cliente
                    </label>
                    <input
                      id="quickClientDisplayName"
                      name="quickClientDisplayName"
                      className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      placeholder="Ej: María García"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="quickClientEmail">
                      Email (opcional)
                    </label>
                    <input
                      id="quickClientEmail"
                      name="quickClientEmail"
                      type="email"
                      className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="quickClientPhone">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="quickClientPhone"
                    name="quickClientPhone"
                    className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <p className="text-xs text-[var(--text-tertiary)]">
                  Este cliente se creará dentro de tu organización.
                </p>
              </div>
            </details>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear obra
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
