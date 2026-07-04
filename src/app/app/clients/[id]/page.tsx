import Link from "next/link";

import { StatusBadge } from "@/components/app/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createMockClientsReader, toClientDetailState } from "@/lib/services/clients";
import { getDemoOrganization } from "@/lib/services/demo-organization";
import { createMockProjectsReader } from "@/lib/services/private-projects";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

const futureSections = ["Comunicaciones", "Documentos", "Presupuestos", "Historial"];

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organization = await getDemoOrganization();
  const clientsReader = createMockClientsReader();
  const projectsReader = createMockProjectsReader();
  const [clientState, projects] = await Promise.all([
    toClientDetailState(await clientsReader.getClient(organization.id, id)),
    projectsReader.listProjects(organization.id),
  ]);

  if (clientState.status === "not_found") {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="Cliente no encontrado"
          description="No hemos encontrado este cliente en los datos demo del MVP."
          actions={<LinkButton href="/app/clients">Volver a clientes</LinkButton>}
        />
      </section>
    );
  }

  if (clientState.status !== "ready") return null;

  const client = clientState.item;
  const associatedProjects = projects.filter((project) => project.clientId === client.id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<Link href="/app/clients" className="text-sm font-medium text-content-secondary hover:text-content-primary">← Volver a clientes</Link>}
        title={client.displayName}
        description="Ficha de cliente para centralizar contacto, obras asociadas y documentación comercial."
        actions={<LinkButton href="/app/clients" variant="secondary">Listado de clientes</LinkButton>}
      />

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card padding="lg" shadow="none">
          <h2 className="text-lg font-semibold">Datos de contacto</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="font-medium text-content-primary">Email</dt><dd className="mt-1 text-content-secondary">{client.email ?? "—"}</dd></div>
            <div><dt className="font-medium text-content-primary">Teléfono</dt><dd className="mt-1 text-content-secondary">{client.phone ?? "—"}</dd></div>
            <div><dt className="font-medium text-content-primary">Dirección</dt><dd className="mt-1 text-content-secondary">{client.address ?? "—"}</dd></div>
            <div className="grid grid-cols-2 gap-4">
              <div><dt className="font-medium text-content-primary">Alta</dt><dd className="mt-1 text-content-secondary">{formatDate(client.createdAt)}</dd></div>
              <div><dt className="font-medium text-content-primary">Actualizado</dt><dd className="mt-1 text-content-secondary">{formatDate(client.updatedAt)}</dd></div>
            </div>
          </dl>
          {client.notes ? (
            <div className="mt-5 rounded-2xl border border-subtle bg-bg-raised p-4">
              <p className="text-sm font-medium">Notas internas</p>
              <p className="mt-1 text-sm text-content-secondary">{client.notes}</p>
            </div>
          ) : null}
        </Card>

        <Card padding="lg" shadow="none">
          <h2 className="text-lg font-semibold">Obras asociadas</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Relación inicial entre cliente y proyectos para validar el flujo del MVP.
          </p>
          {associatedProjects.length === 0 ? (
            <EmptyState className="mt-5" title="Sin obras asociadas" description="Este cliente todavía no tiene obras vinculadas." />
          ) : (
            <div className="mt-5 grid gap-3">
              {associatedProjects.map((project) => (
                <Link key={project.id} href={`/app/projects/${project.id}`} className="rounded-2xl border border-subtle bg-bg-raised p-4 transition-colors hover:bg-bg-surface">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="mt-1 text-sm text-content-secondary">{project.type ?? "Tipo pendiente"} · {project.address ?? "Dirección pendiente"}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <ProgressBar value={project.progress} showValue label="Avance" className="mt-4" tone="info" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card padding="lg" shadow="none">
        <h2 className="text-lg font-semibold">Próximas secciones de cliente</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {futureSections.map((section) => (
            <div key={section} className="rounded-2xl border border-dashed border-subtle bg-bg-raised p-4">
              <p className="font-medium">{section}</p>
              <p className="mt-2 text-xs leading-5 text-content-tertiary">Placeholder para el siguiente incremento funcional.</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
