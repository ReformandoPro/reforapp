/**
 * Datos mock temporales para UI.
 * No representan contratos definitivos de backend.
 * Sustituir por datos reales definidos por Openclaw.
 */
import type { ProjectTaskListItem } from "@/lib/types";

export const mockProjectTasks: ProjectTaskListItem[] = [
  {
    id: "task_fontaneria_bano_principal",
    projectId: "project_obra_centro",
    title: "Resolver bloqueo de fontanería en baño principal",
    status: "blocked",
    priority: "urgent",
    assigneeName: "Equipo Fontanería",
    dueDate: "2026-06-02",
    isDelayed: false,
    isBlocked: true,
    blockedReason: "Falta validación técnica del replanteo.",
    sectionLabel: "Instalaciones",
  },
  {
    id: "task_carpinteria_extra_cliente",
    projectId: "project_obra_centro",
    title: "Validar extra de carpintería con cliente",
    status: "in_progress",
    priority: "high",
    assigneeName: "Jefe de obra",
    dueDate: "2026-05-30",
    isDelayed: true,
    isBlocked: false,
    sectionLabel: "Carpintería",
  },
  {
    id: "task_demolicion_remates",
    projectId: "project_obra_centro",
    title: "Cerrar remates de demolición en cocina",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-04",
    isDelayed: false,
    isBlocked: false,
    sectionLabel: "Demoliciones",
  },
  {
    id: "task_medicion_inicial",
    projectId: "project_obra_centro",
    title: "Completar medición inicial de tabiquería",
    status: "done",
    priority: "medium",
    assigneeName: "Oficina técnica",
    dueDate: "2026-05-26",
    isDelayed: false,
    isBlocked: false,
    sectionLabel: "Mediciones",
  },
];
