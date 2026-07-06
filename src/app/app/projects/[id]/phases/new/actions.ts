"use server";

import { redirect } from "next/navigation";

import { PHASE_STATUSES, type PhaseStatus } from "@/lib/services/phases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canWriteProjectPhases } from "@/lib/services/project-operational-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/phases/new`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function normalizeStatus(projectId: string, raw: string): PhaseStatus {
  const value = raw.trim() as PhaseStatus;
  if (!PHASE_STATUSES.some((s) => s.value === value)) {
    backToNewWithError(projectId, "Estado inválido.");
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

export async function createProjectPhaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/phases/new`);

  const canWrite = canWriteProjectPhases(ctx.role);
  if (!canWrite) backToNewWithError(projectId, "No tienes permisos para crear fases.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToNewWithError(projectId, "Título es obligatorio.");

  const description = readOptionalText(formData, "description");
  const status = normalizeStatus(projectId, String(formData.get("status") ?? "planned"));

  const startDateRaw = readOptionalText(formData, "startDate");
  const start_date = startDateRaw;

  const endDateRaw = readOptionalText(formData, "endDate");
  const end_date = endDateRaw;

  const sortOrder = readOptionalInt(formData, "sortOrder") ?? 0;

  const supabase = await createServerSupabaseClient();

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToNewWithError(projectId, "Obra inválida para tu organización.");
  }

  const { error: insertError } = await supabase.from("project_phases").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    title,
    description,
    status,
    start_date,
    end_date,
    sort_order: sortOrder,
  });

  if (insertError) {
    backToNewWithError(projectId, "No pudimos crear la fase.");
  }

  redirect(`/app/projects/${projectId}/phases`);
}
