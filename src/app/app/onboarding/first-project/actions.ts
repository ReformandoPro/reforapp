"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";

import { isProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToWizardWithError(message: string): never {
  const url = new URL("/app/onboarding/first-project", "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function redirectToProjectWithWarning(projectId: string, warning: string): never {
  const url = new URL(`/app/projects/${projectId}`, "http://local");
  url.searchParams.set("createdFromOnboarding", "1");
  url.searchParams.set("templateWarning", warning);
  redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToWizardWithError(`${label} es obligatorio.`);
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

type TemplateRow = {
  id: string;
  organization_id: string | null;
};

type TemplatePhaseRow = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  default_status: "planned" | "in_progress" | "done" | "blocked" | "cancelled";
};

type TemplateTaskRow = {
  template_phase_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  default_status: "pending" | "in_progress" | "done" | "blocked";
  default_priority: "low" | "medium" | "high" | "urgent";
};

export async function createFirstProjectFromOnboardingAction(formData: FormData) {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/onboarding/first-project");
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToWizardWithError("No tienes permisos para crear obras.");
  }

  const name = readRequiredText(formData, "name", "Nombre");
  const address = readRequiredText(formData, "address", "Dirección");
  const type = readRequiredText(formData, "type", "Tipo");

  const statusRaw = "lead";
  if (!isProjectStatus(statusRaw)) {
    backToWizardWithError("Estado inválido.");
  }

  const templateChoiceRaw = String(formData.get("templateId") ?? "").trim();
  const templateId = templateChoiceRaw === "none" || templateChoiceRaw === "" ? null : templateChoiceRaw;

  const quickClientEnabled = String(formData.get("quickClientEnabled") ?? "") === "on";

  const supabase = await createServerSupabaseClient();

  let clientId = String(formData.get("clientId") ?? "").trim();

  if (quickClientEnabled) {
    const displayName = readRequiredText(formData, "quickClientDisplayName", "Nombre del cliente");
    const email = readOptionalText(formData, "quickClientEmail");
    const phone = readOptionalText(formData, "quickClientPhone");

    const { data: createdClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        organization_id: ctx.organizationId,
        display_name: displayName,
        email,
        phone,
      })
      .select("id")
      .single();

    const createdClientId = createdClient?.id;

    if (clientError || !createdClientId) {
      backToWizardWithError("No pudimos crear el cliente. Revisa los datos e inténtalo de nuevo.");
    }

    clientId = createdClientId;
  }

  if (!clientId) {
    backToWizardWithError("Debes seleccionar o crear un cliente.");
  }

  // Validate client belongs to org (defense-in-depth; RLS also enforces this)
  const { data: clientRow, error: clientLookupError } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId)
    .maybeSingle();

  const clientDisplayName = clientRow?.display_name;

  if (clientLookupError || !clientDisplayName) {
    backToWizardWithError("Cliente inválido para tu organización.");
  }

  const projectId = crypto.randomUUID();

  // Keep compatibility with legacy NOT NULL columns used in the current projects schema.
  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    organization_id: ctx.organizationId,
    client_id: clientId,
    name,
    title: name,
    client_name: clientDisplayName,
    status: statusRaw,
    address,
    type,
    progress: 0,
    start_date: new Date().toISOString(),
  });

  if (projectError) {
    backToWizardWithError("No pudimos crear la obra. Revisa los datos e inténtalo de nuevo.");
  }

  if (templateId) {
    // Validate template visibility (global or same org).
    const { data: templateRow, error: templateError } = await supabase
      .from("project_templates")
      .select("id, organization_id")
      .eq("id", templateId)
      .maybeSingle();

    const template = templateRow as TemplateRow | null;

    if (templateError || !template) {
      backToWizardWithError("Plantilla inválida.");
    }

    const visible = template.organization_id === null || template.organization_id === ctx.organizationId;
    if (!visible) {
      backToWizardWithError("No tienes acceso a esa plantilla.");
    }

    // Load template phases.
    const { data: templatePhases, error: phasesError } = await supabase
      .from("project_template_phases")
      .select("id, title, description, sort_order, default_status")
      .eq("template_id", templateId)
      .order("sort_order", { ascending: true });

    if (phasesError) {
      backToWizardWithError("No pudimos cargar la plantilla. Inténtalo de nuevo.");
    }

    const phaseRows = (templatePhases ?? []) as TemplatePhaseRow[];

    // Insert project phases one-by-one to keep an exact mapping template_phase_id -> project_phase_id.
    const phaseMap = new Map<string, string>();
    const insertedProjectPhaseIds: string[] = [];

    for (const p of phaseRows) {
      const { data: insertedPhase, error: insertPhaseError } = await supabase
        .from("project_phases")
        .insert({
          organization_id: ctx.organizationId,
          project_id: projectId,
          title: p.title,
          description: p.description,
          sort_order: p.sort_order,
          status: p.default_status,
        })
        .select("id")
        .single();

      const insertedId = insertedPhase?.id as string | undefined;

      if (insertPhaseError || !insertedId) {
        if (insertedProjectPhaseIds.length > 0) {
          await supabase.from("project_phases").delete().in("id", insertedProjectPhaseIds);
        }
        redirectToProjectWithWarning(projectId, "phases_failed");
      }

      insertedProjectPhaseIds.push(insertedId);
      phaseMap.set(p.id, insertedId);
    }

    // Load template tasks for these phases.
    const templatePhaseIds = phaseRows.map((p) => p.id);
    const { data: templateTasks, error: tasksError } = await supabase
      .from("project_template_tasks")
      .select("template_phase_id, title, description, sort_order, default_status, default_priority")
      .in("template_phase_id", templatePhaseIds)
      .order("sort_order", { ascending: true });

    if (tasksError) {
      // Best-effort cleanup: remove inserted phases for this project.
      const insertedIds = Array.from(phaseMap.values());
      if (insertedIds.length > 0) {
        await supabase.from("project_phases").delete().in("id", insertedIds);
      }
      redirectToProjectWithWarning(projectId, "tasks_load_failed");
    }

    const taskRows = (templateTasks ?? []) as TemplateTaskRow[];

    if (taskRows.length > 0) {
      const insertedProjectTaskIds: string[] = [];

      for (const t of taskRows) {
        const phaseId = phaseMap.get(t.template_phase_id) ?? null;

        const { data: insertedTask, error: insertTaskError } = await supabase
          .from("project_tasks")
          .insert({
            organization_id: ctx.organizationId,
            project_id: projectId,
            title: t.title,
            description: t.description,
            status: t.default_status,
            priority: t.default_priority,
            phase_id: phaseId,
          })
          .select("id")
          .single();

        const insertedTaskId = insertedTask?.id as string | undefined;

        if (insertTaskError || !insertedTaskId) {
          if (insertedProjectTaskIds.length > 0) {
            await supabase.from("project_tasks").delete().in("id", insertedProjectTaskIds);
          }

          const insertedPhaseIds = Array.from(phaseMap.values());
          if (insertedPhaseIds.length > 0) {
            await supabase.from("project_phases").delete().in("id", insertedPhaseIds);
          }

          redirectToProjectWithWarning(projectId, "tasks_insert_failed");
        }

        insertedProjectTaskIds.push(insertedTaskId);
      }
    }
  }

  redirect(`/app/projects/${projectId}?createdFromOnboarding=1`);
}
