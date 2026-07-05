import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { createSupabaseClientsReader, toClientsListState } from "@/lib/services/clients";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

export default async function AppClientsPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    if (ctx.reason === "missing_membership") {
      redirect("/app/onboarding");
    }

    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ErrorState
          title="No se pudieron cargar los clientes"
          description="No pudimos resolver tu organización. Inicia sesión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const reader = createSupabaseClientsReader(supabase);
  const state = await reader
    .listClients(ctx.organizationId)
    .then(toClientsListState)
    .catch((error: unknown) => {
      console.error("Clients list query failed", error);

      return {
        status: "error" as const,
        message: "No se pudieron cargar los clientes.",
      };
    });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Expedientes de clientes vinculados a obras, presupuestos y documentación."
        actions={<LinkButton href="/app" variant="secondary">Volver al panel</LinkButton>}
      />

      {state.status === "error" ? (
        <ErrorState
          title="No se pudieron cargar los clientes"
          description={state.message}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          title="Todavía no hay clientes"
          description="Cuando se cree el primer cliente, aparecerá aquí con sus datos de contacto y obras asociadas."
          actions={<LinkButton href="/app/clients/new">Nuevo cliente</LinkButton>}
        />
      ) : null}

      {state.status === "ready" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {state.items.map((client) => (
            <Card key={client.id} padding="lg" shadow="none">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{client.displayName}</h2>
                  <dl className="mt-3 space-y-2 text-sm text-content-secondary">
                    <div><dt className="font-medium text-content-primary">Email</dt><dd>{client.email ?? "—"}</dd></div>
                    <div><dt className="font-medium text-content-primary">Teléfono</dt><dd>{client.phone ?? "—"}</dd></div>
                    <div><dt className="font-medium text-content-primary">Dirección</dt><dd>{client.address ?? "—"}</dd></div>
                  </dl>
                </div>
                <Link
                  href={`/app/clients/${client.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-bg-raised"
                >
                  Ver ficha
                </Link>
              </div>
              {client.notes ? (
                <p className="mt-5 rounded-2xl border border-subtle bg-bg-raised p-4 text-sm text-content-secondary">
                  {client.notes}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
