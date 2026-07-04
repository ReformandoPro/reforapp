import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { createMockClientsReader, toClientsListState } from "@/lib/services/clients";
import { getDemoOrganization } from "@/lib/services/demo-organization";

export const dynamic = "force-dynamic";

export default async function AppClientsPage() {
  const organization = await getDemoOrganization();
  const reader = createMockClientsReader();
  const state = await toClientsListState(await reader.listClients(organization.id));

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Expedientes de clientes vinculados a obras, presupuestos y documentación."
        actions={<LinkButton href="/app" variant="secondary">Volver al panel</LinkButton>}
      />

      {state.status === "empty" ? (
        <EmptyState
          title="Todavía no hay clientes"
          description="Cuando se cree el primer cliente, aparecerá aquí con sus datos de contacto y obras asociadas."
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
