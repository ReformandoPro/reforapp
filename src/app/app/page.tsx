import Link from "next/link";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { mockOrganization } from "@/lib/mock/reformando";
import { createMockClientsReader } from "@/lib/services/clients";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { getOrganizationById } from "@/lib/services/organizations";
import { createMockProjectsReader } from "@/lib/services/private-projects";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export default async function AppDashboardPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    if (ctx.reason === "missing_membership") {
      redirect("/app/onboarding");
    }

    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card padding="lg" shadow="none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Panel de control</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            No pudimos resolver tu organización. Inicia sesión e inténtalo de nuevo.
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const organizationResult = await getOrganizationById(supabase, ctx.organizationId);

  if (!organizationResult.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card padding="lg" shadow="none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Panel de control</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Tu membership existe, pero no pudimos cargar la organización asociada.
          </p>
        </Card>
      </section>
    );
  }

  const organization = organizationResult.organization;
  const projectsReader = createMockProjectsReader();
  const clientsReader = createMockClientsReader();
  const [projects, clients] = await Promise.all([
    projectsReader.listProjects(mockOrganization.id),
    clientsReader.listClients(mockOrganization.id),
  ]);

  const activeProjects = projects.filter((project) =>
    ["approved", "scheduled", "in_progress", "paused"].includes(project.status)
  );
  const budgetingProjects = projects.filter((project) => project.status === "budgeting");
  const averageProgress = average(projects.map((project) => project.progress));

  const recentActivity = [
    "Presupuesto pendiente de revisión en Adecuación local Serrano.",
    "Reforma integral vivienda García avanzó a fase de instalaciones.",
    "Documentación de cliente preparada para revisión interna.",
  ];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow={
          <span className="text-sm font-medium text-content-tertiary">
            {organization.name} · rol {ctx.role}
          </span>
        }
        title="Panel de control"
        description="Resumen operativo de clientes, obras y próximos pasos para la empresa de reformas."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/app/projects">Ver obras</LinkButton>
            <LinkButton href="/app/clients" variant="secondary">Ver clientes</LinkButton>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Obras activas" value={activeProjects.length} helper="En producción o planificación" />
        <StatCard label="En presupuesto" value={budgetingProjects.length} helper="Pendientes de cierre comercial" />
        <StatCard label="Clientes registrados" value={clients.length} helper="Contactos con expediente" />
        <StatCard label="Avance medio" value={`${averageProgress}%`} helper="Estimación operativa mock" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card padding="lg" shadow="none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Obras prioritarias</h2>
              <p className="mt-1 text-sm text-content-secondary">
                Seguimiento rápido de producción, presupuesto y avance.
              </p>
            </div>
            <Link href="/app/projects" className="text-sm font-medium text-content-secondary hover:text-content-primary">
              Ver todas
            </Link>
          </div>

          <div className="mt-5 grid gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="rounded-2xl border border-subtle bg-bg-raised p-4 transition-colors hover:bg-bg-surface"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="mt-1 text-sm text-content-secondary">
                      {project.clientName ?? "Cliente sin asignar"} · {project.address ?? "Dirección pendiente"}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <ProgressBar value={project.progress} showValue label="Avance" className="mt-4" tone="info" />
              </Link>
            ))}
          </div>
        </Card>

        <Card padding="lg" shadow="none">
          <h2 className="text-lg font-semibold">Próximas acciones</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Señales operativas para preparar el siguiente día de obra.
          </p>
          <ul className="mt-5 space-y-3">
            {recentActivity.map((item) => (
              <li key={item} className="rounded-2xl border border-subtle bg-bg-raised p-4 text-sm text-content-secondary">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
