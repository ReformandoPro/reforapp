"use server";

import { revalidatePath } from "next/cache";

import {
  isUuid,
  validateCreateProjectTaskForm,
  type CreateProjectTaskFieldErrors,
} from "@/lib/services/project-task-create";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canWriteProjectTasks } from "@/lib/services/project-operational-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

const PROJECT_TASK_CREATE_LOG_PREFIX = "[project-task-create]";

export type CreateProjectTaskActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: CreateProjectTaskFieldErrors;
};

export const INITIAL_CREATE_PROJECT_TASK_STATE: CreateProjectTaskActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

function errorState(
  message: string,
  fieldErrors: CreateProjectTaskFieldErrors = {}
): CreateProjectTaskActionState {
  return { status: "error", message, fieldErrors };
}

function logCreateFailure(reason: string): void {
  console.error(PROJECT_TASK_CREATE_LOG_PREFIX, { reason });
}

export async function createProjectTaskAction(
  projectId: string,
  _previousState: CreateProjectTaskActionState,
  formData: FormData
): Promise<CreateProjectTaskActionState> {
  if (!isUuid(projectId)) {
    return errorState("No pudimos crear la tarea.");
  }

  const validation = validateCreateProjectTaskForm(formData);
  if (!validation.ok) {
    return errorState("Revisa los campos indicados.", validation.fieldErrors);
  }

  const context = await getOrganizationContextForRequest();
  if (!context.ok || !canWriteProjectTasks(context.role)) {
    return errorState("No tienes permisos para crear tareas.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    logCreateFailure("project_query_failed");
    return errorState("No pudimos crear la tarea.");
  }

  if (!project) {
    return errorState("No pudimos acceder al proyecto.");
  }

  if (validation.input.phaseId) {
    const { data: phase, error: phaseError } = await supabase
      .from("project_phases")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("project_id", projectId)
      .eq("id", validation.input.phaseId)
      .maybeSingle();

    if (phaseError) {
      logCreateFailure("phase_query_failed");
      return errorState("No pudimos crear la tarea.");
    }

    if (!phase) {
      return errorState("Revisa los campos indicados.", {
        phaseId: "Selecciona una fase válida para este proyecto.",
      });
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("project_tasks")
    .insert({
      organization_id: context.organizationId,
      project_id: projectId,
      phase_id: validation.input.phaseId,
      title: validation.input.title,
      description: validation.input.description,
      priority: validation.input.priority,
      due_date: validation.input.dueDate,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    logCreateFailure("insert_failed");
    return errorState("No pudimos crear la tarea. Inténtalo de nuevo.");
  }

  revalidatePath(`/projects/${projectId}`);

  return {
    status: "success",
    message: "Tarea creada. Ya aparece en Pendientes.",
    fieldErrors: {},
  };
}
