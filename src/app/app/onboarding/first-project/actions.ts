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

  redirect(`/app/projects/${projectId}?createdFromOnboarding=1`);
}
