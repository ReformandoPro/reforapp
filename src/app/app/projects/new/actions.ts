"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";

import { isProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(message: string) {
  const url = new URL("/app/projects/new", "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToNewWithError(`${label} es obligatorio.`);
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function createProjectWithOptionalQuickClient(formData: FormData) {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/projects/new");
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToNewWithError("No tienes permisos para crear obras.");
  }

  const name = readRequiredText(formData, "name", "Nombre");
  const statusRaw = readRequiredText(formData, "status", "Estado");
  if (!isProjectStatus(statusRaw)) {
    backToNewWithError("Estado inválido.");
  }
  const address = readRequiredText(formData, "address", "Dirección");
  const type = readRequiredText(formData, "type", "Tipo");

  const progressRaw = String(formData.get("progress") ?? "0").trim();
  const progress = Number.isFinite(Number(progressRaw)) ? Number(progressRaw) : NaN;
  const safeProgress = Number.isFinite(progress) ? progress : 0;

  const quickClientEnabled = String(formData.get("quickClientEnabled") ?? "") === "on";

  const supabase = await createServerSupabaseClient();

  let clientId = String(formData.get("clientId") ?? "").trim();

  if (quickClientEnabled) {
    const displayName = readRequiredText(
      formData,
      "quickClientDisplayName",
      "Nombre del cliente"
    );
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
      backToNewWithError(
        "No pudimos crear el cliente. Revisa los datos e inténtalo de nuevo."
      );
    }

    clientId = createdClientId;
  }

  if (!clientId) {
    backToNewWithError("Debes seleccionar o crear un cliente.");
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
    backToNewWithError("Cliente inválido para tu organización.");
  }

  const projectId = crypto.randomUUID();

  // NOTE: projects table currently has legacy NOT NULL columns (title, client_name, start_date).
  // We map minimally to satisfy constraints.
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
    progress: Math.max(0, Math.min(100, Math.trunc(safeProgress))),
    start_date: new Date().toISOString(),
  });

  if (projectError) {
    backToNewWithError("No pudimos crear la obra. Revisa los datos e inténtalo de nuevo.");
  }

  redirect(`/app/projects/${projectId}`);
}

