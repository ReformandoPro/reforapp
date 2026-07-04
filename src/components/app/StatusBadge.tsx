import { Badge } from "@/components/ui/Badge";
import type { ProjectLifecycleStatus } from "@/lib/types/reformando";

const labels: Record<ProjectLifecycleStatus, string> = {
  lead: "Oportunidad",
  budgeting: "En presupuesto",
  approved: "Aprobada",
  scheduled: "Planificada",
  in_progress: "En obra",
  paused: "Pausada",
  completed: "Completada",
  delivered: "Entregada",
  closed: "Cerrada",
  cancelled: "Cancelada",
};

const tones: Record<ProjectLifecycleStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  lead: "neutral",
  budgeting: "warning",
  approved: "info",
  scheduled: "info",
  in_progress: "success",
  paused: "warning",
  completed: "success",
  delivered: "success",
  closed: "neutral",
  cancelled: "danger",
};

export function StatusBadge({ status }: { status: ProjectLifecycleStatus }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}

export function getProjectStatusLabel(status: ProjectLifecycleStatus) {
  return labels[status];
}
