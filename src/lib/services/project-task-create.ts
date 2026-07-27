import {
  isProjectTaskPriority,
  type ProjectTaskPriority,
} from "@/lib/services/project-tasks";

export const PROJECT_TASK_TITLE_MIN_LENGTH = 3;
export const PROJECT_TASK_TITLE_MAX_LENGTH = 160;
export const PROJECT_TASK_DESCRIPTION_MAX_LENGTH = 2_000;

export type CreateProjectTaskFieldErrors = Partial<
  Record<"title" | "description" | "priority" | "dueDate" | "phaseId", string>
>;

export type CreateProjectTaskInput = {
  title: string;
  description: string | null;
  priority: ProjectTaskPriority;
  dueDate: string | null;
  phaseId: string | null;
};

export type CreateProjectTaskValidationResult =
  | { ok: true; input: CreateProjectTaskInput }
  | { ok: false; fieldErrors: CreateProjectTaskFieldErrors };

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateCreateProjectTaskForm(
  formData: FormData
): CreateProjectTaskValidationResult {
  const fieldErrors: CreateProjectTaskFieldErrors = {};
  const title = readText(formData, "title");
  const descriptionValue = readText(formData, "description");
  const priorityValue = readText(formData, "priority") || "medium";
  const dueDateValue = readText(formData, "due_date");
  const phaseIdValue = readText(formData, "phase_id");

  if (title.length < PROJECT_TASK_TITLE_MIN_LENGTH) {
    fieldErrors.title = `El título debe tener al menos ${PROJECT_TASK_TITLE_MIN_LENGTH} caracteres.`;
  } else if (title.length > PROJECT_TASK_TITLE_MAX_LENGTH) {
    fieldErrors.title = `El título no puede superar ${PROJECT_TASK_TITLE_MAX_LENGTH} caracteres.`;
  }

  if (descriptionValue.length > PROJECT_TASK_DESCRIPTION_MAX_LENGTH) {
    fieldErrors.description = `La descripción no puede superar ${PROJECT_TASK_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  if (!isProjectTaskPriority(priorityValue)) {
    fieldErrors.priority = "Selecciona una prioridad válida.";
  }

  if (dueDateValue && !isIsoDate(dueDateValue)) {
    fieldErrors.dueDate = "Introduce una fecha límite válida.";
  }

  if (phaseIdValue && !isUuid(phaseIdValue)) {
    fieldErrors.phaseId = "Selecciona una fase válida.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      title,
      description: descriptionValue || null,
      priority: priorityValue as ProjectTaskPriority,
      dueDate: dueDateValue || null,
      phaseId: phaseIdValue || null,
    },
  };
}
