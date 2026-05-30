/**
 * Datos mock temporales para UI.
 * No representan contratos definitivos de backend.
 * Sustituir por datos reales definidos por Openclaw.
 */
import type { ProjectCard, ProjectOverview } from "@/lib/types";

export const mockProjectCard: ProjectCard = {
  id: "project_obra_centro",
  name: "Reforma integral — Calle Mayor 18",
  clientName: "Familia Ortega",
  status: "in_progress",
  delayedTasksCount: 2,
  blockedTasksCount: 1,
  pendingApprovalsCount: 3,
};

export const mockProjectCards: ProjectCard[] = [mockProjectCard];

export const mockProjectOverview: ProjectOverview = {
  id: "project_obra_centro",
  name: "Reforma integral — Calle Mayor 18",
  clientName: "Familia Ortega",
  status: "in_progress",
  nextActions: [
    "Resolver bloqueo de fontanería en baño principal",
    "Validar aprobación del extra de carpintería",
  ],
  availableSections: [
    { key: "tasks", label: "Tareas", enabled: true },
    { key: "incidents", label: "Incidencias", enabled: true },
    { key: "materials", label: "Materiales", enabled: true },
    { key: "budget", label: "Presupuesto", enabled: true },
    { key: "documents", label: "Documentos", enabled: false },
  ],
  delayedTasksCount: 2,
  blockedTasksCount: 1,
  pendingApprovalsCount: 3,
  openIncidentsCount: 2,
  pendingMaterialRequestsCount: 1,
};
