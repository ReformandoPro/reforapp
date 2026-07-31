"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  validateCreateProjectForm,
  type CreateProjectFieldErrors,
} from "@/lib/services/project-create";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canCreateProjects } from "@/lib/services/project-operational-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import type { CreateProjectActionState } from "./state";

const PROJECT_CREATE_LOG_PREFIX = "[project-create]";
const PROJECT_STATUS_CANDIDATES = ["in_progress", "active", "open"] as const;

type ProjectInsertError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function errorState(
  message: string,
  fieldErrors: CreateProjectFieldErrors = {}
): CreateProjectActionState {
  return { status: "error", message, fieldErrors };
}

function logCreateFailure(reason: string): void {
  console.error(PROJECT_CREATE_LOG_PREFIX, { reason });
}

function isProjectStatusConstraintError(error: ProjectInsertError | null): boolean {
  if (error?.code !== "23514") return false;

  return [error.message, error.details, error.hint].some((value) =>
    value?.includes("projects_status_check")
  );
}

export async function createProjectAction(
  _previousState: CreateProjectActionState,
  formData: FormData
): Promise<CreateProjectActionState> {
  const validation = validateCreateProjectForm(formData);
  if (!validation.ok) {
    return errorState("Revisa los campos indicados.", validation.fieldErrors);
  }

  const context = await getOrganizationContextForRequest();
  if (!context.ok || !canCreateProjects(context.role)) {
    return errorState("No tienes permisos para crear obras.");
  }

  const supabase = await createServerSupabaseClient();
  let clientName = "Sin cliente";

  if (validation.input.clientId) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, display_name")
      .eq("organization_id", context.organizationId)
      .eq("id", validation.input.clientId)
      .maybeSingle();

    if (clientError) {
      logCreateFailure("client_query_failed");
      return errorState("No pudimos crear la obra.");
    }

    if (!client?.display_name) {
      return errorState("Revisa los campos indicados.", {
        clientId: "Selecciona un cliente válido para tu organización.",
      });
    }

    clientName = client.display_name;
  }

  const projectPayload = {
    id: crypto.randomUUID(),
    organization_id: context.organizationId,
    client_id: validation.input.clientId,
    name: validation.input.name,
    title: validation.input.name,
    client_name: clientName,
    description: validation.input.description,
    start_date: validation.input.startDate,
    expected_end_date: validation.input.expectedEndDate,
    address: "",
    type: "",
    progress: 0,
  };

  let project: { id: string } | null = null;
  let insertError: ProjectInsertError | null = null;

  for (const status of PROJECT_STATUS_CANDIDATES) {
    const result = await supabase
      .from("projects")
      .insert({ ...projectPayload, status })
      .select("id")
      .single();

    project = result.data as { id: string } | null;
    insertError = result.error;

    if (!insertError || !isProjectStatusConstraintError(insertError)) break;
  }

  if (insertError || !project?.id) {
    logCreateFailure("insert_failed");
    return errorState("No pudimos crear la obra. Inténtalo de nuevo.");
  }

  revalidatePath("/app");
  revalidatePath("/app/projects");
  redirect("/app/projects");
}
