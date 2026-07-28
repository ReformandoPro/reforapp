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

const PROJECT_CREATE_LOG_PREFIX = "[project-create]";

export type CreateProjectActionState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: CreateProjectFieldErrors;
};

export const INITIAL_CREATE_PROJECT_STATE: CreateProjectActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
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

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      organization_id: context.organizationId,
      client_id: validation.input.clientId,
      name: validation.input.name,
      title: validation.input.name,
      client_name: clientName,
      description: validation.input.description,
      start_date: validation.input.startDate,
      expected_end_date: validation.input.expectedEndDate,
      status: "in_progress",
      address: "",
      type: "",
      progress: 0,
    })
    .select("id")
    .single();

  if (insertError || !project?.id) {
    logCreateFailure("insert_failed");
    return errorState("No pudimos crear la obra. Inténtalo de nuevo.");
  }

  revalidatePath("/app");
  revalidatePath("/app/projects");
  redirect("/app/projects");
}
