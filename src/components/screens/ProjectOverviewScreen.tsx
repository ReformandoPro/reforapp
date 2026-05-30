import type { ProjectOverview } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type ProjectOverviewScreenProps = {
  project: ProjectOverview;
};

export function ProjectOverviewScreen({ project }: ProjectOverviewScreenProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Obra</p>
          <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
          <p className="mt-1 text-sm text-slate-600">Cliente: {project.clientName}</p>
        </div>
        <Badge tone="info">{project.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Tareas retrasadas</p>
          <p className="mt-2 text-2xl font-semibold">{project.delayedTasksCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Bloqueos</p>
          <p className="mt-2 text-2xl font-semibold">{project.blockedTasksCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Aprobaciones pendientes</p>
          <p className="mt-2 text-2xl font-semibold">{project.pendingApprovalsCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Incidencias abiertas</p>
          <p className="mt-2 text-2xl font-semibold">{project.openIncidentsCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Materiales pendientes</p>
          <p className="mt-2 text-2xl font-semibold">{project.pendingMaterialRequestsCount}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Próximas acciones</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {project.nextActions.map((action) => (
              <li key={action} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                {action}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Secciones disponibles</h3>
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
