import type { ProjectOverview } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type ProjectOverviewScreenProps = {
  project: ProjectOverview;
};

export function ProjectOverviewScreen({ project }: ProjectOverviewScreenProps) {
  return (
    <Card padding="lg" shadow="none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-overline text-content-tertiary">Obra</p>
          <h2 className="text-h3 text-content-primary">{project.name}</h2>
          <p className="mt-1 text-body text-content-secondary">Cliente: {project.clientName}</p>
        </div>
        <Badge tone="info">{project.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Tareas retrasadas</p>
          <p className="mt-2 text-h2 text-content-primary">{project.delayedTasksCount}</p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Bloqueos</p>
          <p className="mt-2 text-h2 text-content-primary">{project.blockedTasksCount}</p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Aprobaciones pendientes</p>
          <p className="mt-2 text-h2 text-content-primary">{project.pendingApprovalsCount}</p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Incidencias abiertas</p>
          <p className="mt-2 text-h2 text-content-primary">{project.openIncidentsCount}</p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Materiales pendientes</p>
          <p className="mt-2 text-h2 text-content-primary">{project.pendingMaterialRequestsCount}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-h3 text-content-primary">Próximas acciones</h3>
          <ul className="mt-3 space-y-2 text-body text-content-secondary">
            {project.nextActions.map((action) => (
              <li key={action} className="rounded-lg border border-subtle bg-bg-surface-raised px-3 py-2">
                {action}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-h3 text-content-primary">Secciones disponibles</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.availableSections.map((section) => (
              <Badge key={section.key} tone={section.enabled ? "info" : "neutral"}>
                {section.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
