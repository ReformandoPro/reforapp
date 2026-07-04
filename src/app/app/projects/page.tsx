import Link from "next/link";

import { StatusBadge } from "@/components/app/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getDemoOrganization } from "@/lib/services/demo-organization";
import { createMockProjectsReader, toProjectsListState } from "@/lib/services/private-projects";

export const dynamic = "force-dynamic";

export default async function AppProjectsPage() {
  const organization = await getDemoOrganization();
  const reader = createMockProjectsReader();
  const state = await toProjectsListState(await reader.listProjects(organization.id));

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Obras"
        description="Listado operativo de proyectos, presupuestos y avance de producción."
        actions={<LinkButton href="/app">Volver al panel</LinkButton>}
      />

      {state.status === "empty" ? (
        <EmptyState
          title="Todavía no hay obras"
          description="Cuando se cree la primera obra, aparecerá aquí con su cliente, estado y avance."
        />
      ) : null}

      {state.status === "ready" ? (
        <div className="grid gap-4">
          {state.items.map((project) => (
            <Card key={project.id} padding="lg" shadow="none">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{project.name}</h2>
                    <StatusBadge status={project.status} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-content-secondary sm:grid-cols-2">
                    <div><dt className="font-medium text-content-primary">Cliente</dt><dd>{project.clientName ?? "Sin cliente"}</dd></div>
                    <div><dt className="font-medium text-content-primary">Tipo</dt><dd>{project.type ?? "Pendiente"}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-medium text-content-primary">Dirección</dt><dd>{project.address ?? "Pendiente"}</dd></div>
                  </dl>
                </div>
                <Link
                  href={`/app/projects/${project.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-bg-raised"
                >
                  Ver detalle
                </Link>
              </div>
              <ProgressBar value={project.progress} showValue label="Avance estimado" className="mt-5" tone="info" />
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
