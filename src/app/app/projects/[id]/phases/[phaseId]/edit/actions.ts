"use server";

import { redirect } from "next/navigation";

import { PHASE_STATUSES, type PhaseStatus } from "@/lib/services/phases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(projectId: string, phaseId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/phases/${phaseId}/edit`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function normalizeStatus(projectId: string, phaseId: string, raw: string): PhaseStatus {
  const value = raw.trim() as PhaseStatus;
  if (!PHASE_STATUSES.some((s) => s.value === value)) {
    backToEditWithError(projectId, phaseId, "Estado inválido.");
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function readOptionalInt(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export async function updateProjectPhaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const phaseId = String(formData.get("phaseId") ?? "").trim();
  if (!projectId || !phaseId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/phases/${phaseId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, phaseId, "No tienes permisos para editar fases.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToEditWithError(projectId, phaseId, "Título es obligatorio.");

  const description = readOptionalText(formData, "description");
  const status = normalizeStatus(projectId, phaseId, String(formData.get("status") ?? "planned"));
  const start_date = readOptionalText(formData, "startDate");
  const end_date = readOptionalText(formData, "endDate");
  const sort_order = readOptionalInt(formData, "sortOrder") ?? 0;

  const supabase = await createServerSupabaseClient();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!projectRow) {
    backToEditWithError(projectId, phaseId, "Obra inválida para tu organización.");
  }

  const { data: phaseRow } = await supabase
    .from("project_phases")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", phaseId)
    .maybeSingle();

  if (!phaseRow) {
    backToEditWithError(projectId, phaseId, "Fase inválida para esta obra.");
  }

  const { error: updateError } = await supabase
    .from("project_phases")
    .update({ title, description, status, start_date, end_date, sort_order })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", phaseId);

  if (updateError) {
    backToEditWithError(projectId, phaseId, "No pudimos guardar la fase.");
  }

  redirect(`/app/projects/${projectId}/phases`);
}

export async function deleteProjectPhaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const phaseId = String(formData.get("phaseId") ?? "").trim();
  if (!projectId || !phaseId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/phases/${phaseId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, phaseId, "No tienes permisos para eliminar fases.");

  const supabase = await createServerSupabaseClient();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!projectRow) {
    backToEditWithError(projectId, phaseId, "Obra inválida para tu organización.");
  }

  const { data: phaseRow } = await supabase
    .from("project_phases")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", phaseId)
    .maybeSingle();

  if (!phaseRow) {
    backToEditWithError(projectId, phaseId, "Fase inválida para esta obra.");
  }

  const { error: deleteError } = await supabase
    .from("project_phases")
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", phaseId);

  if (deleteError) {
    backToEditWithError(projectId, phaseId, "No pudimos eliminar la fase.");
  }

  redirect(`/app/projects/${projectId}/phases`);
}
