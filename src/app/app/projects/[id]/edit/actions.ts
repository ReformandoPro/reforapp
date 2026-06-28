"use server";

import { redirect } from "next/navigation";

import { isProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(projectId: string, message: string) {
  const url = new URL(`/app/projects/${projectId}/edit`, "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToEditWithError(
      String(formData.get("projectId") ?? ""),
      `${label} es obligatorio.`
    );
  }
  return value;
}

export async function updateProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) {
    redirect("/app/projects");
  }

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/projects/${projectId}/edit`);
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToEditWithError(projectId, "No tienes permisos para editar obras.");
  }

  const name = readRequiredText(formData, "name", "Nombre");
  const statusRaw = readRequiredText(formData, "status", "Estado");
  if (!isProjectStatus(statusRaw)) {
    backToEditWithError(projectId, "Estado inválido.");
  }
  const address = readRequiredText(formData, "address", "Dirección");
  const type = readRequiredText(formData, "type", "Tipo");

  const progressRaw = String(formData.get("progress") ?? "0").trim();
  const progressParsed = Number(progressRaw);
  const progress = Number.isFinite(progressParsed) ? progressParsed : 0;
  const safeProgress = Math.max(0, Math.min(100, Math.trunc(progress)));

  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) {
    backToEditWithError(projectId, "Debes seleccionar un cliente.");
  }

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org (defense-in-depth; RLS also enforces)
  const { data: projectRow, error: projectLookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectLookupError || !projectRow) {
    backToEditWithError(projectId, "Obra inválida para tu organización.");
  }

  // Validate client belongs to org
  const { data: clientRow, error: clientLookupError } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId)
    .maybeSingle();

  const clientDisplayName = clientRow?.display_name;
  if (clientLookupError || !clientDisplayName) {
    backToEditWithError(projectId, "Cliente inválido para tu organización.");
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      name,
      title: name,
      status: statusRaw,
      address,
      type,
      progress: safeProgress,
      client_id: clientId,
      client_name: clientDisplayName,
    })
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId);

  if (updateError) {
    backToEditWithError(projectId, "No pudimos guardar los cambios.");
  }

  redirect(`/app/projects/${projectId}`);
}

