"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToProgressWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/progress`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string, projectId: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToProgressWithError(projectId, `${label} es obligatorio.`);
  }
  return value;
}

function readProgress(formData: FormData, projectId: string): number {
  const raw = String(formData.get("progress") ?? "").trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    backToProgressWithError(projectId, "Progreso inválido.");
  }
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > 100) {
    backToProgressWithError(projectId, "El progreso debe estar entre 0 y 100.");
  }
  return rounded;
}

export async function addProjectProgressUpdateAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/progress`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToProgressWithError(projectId, "No tienes permisos para registrar avances.");
  }

  const progress = readProgress(formData, projectId);
  const note = readRequiredText(formData, "note", "Nota", projectId);

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToProgressWithError(projectId, "Obra inválida para tu organización.");
  }

  // 1) Insert progress update
  const { error: insertError } = await supabase
    .from("project_progress_updates")
    .insert({
      organization_id: ctx.organizationId,
      project_id: projectId,
      author_user_id: ctx.user.id,
      progress,
      note,
    });

  if (insertError) {
    backToProgressWithError(projectId, "No pudimos guardar el avance.");
  }

  // 2) Update project progress
  const { error: updateError } = await supabase
    .from("projects")
    .update({ progress })
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId);

  if (updateError) {
    backToProgressWithError(projectId, "Avance guardado, pero no pudimos actualizar el progreso.");
  }

  redirect(`/app/projects/${projectId}/progress`);
}
