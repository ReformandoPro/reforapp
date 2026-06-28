export type PhaseStatus = "planned" | "in_progress" | "done" | "blocked" | "cancelled";

export const PHASE_STATUSES: { value: PhaseStatus; label: string }[] = [
  { value: "planned", label: "Planificada" },
  { value: "in_progress", label: "En curso" },
  { value: "blocked", label: "Bloqueada" },
  { value: "done", label: "Hecha" },
  { value: "cancelled", label: "Cancelada" },
];
