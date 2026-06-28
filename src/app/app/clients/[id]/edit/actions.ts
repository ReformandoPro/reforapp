"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(clientId: string, message: string) {
  const url = new URL(`/app/clients/${clientId}/edit`, "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    const id = String(formData.get("clientId") ?? "");
    backToEditWithError(id, `${label} es obligatorio.`);
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function updateClient(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) {
    redirect("/app/clients");
  }

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/clients/${clientId}/edit`);
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToEditWithError(clientId, "No tienes permisos para editar clientes.");
  }

  const displayName = readRequiredText(formData, "display_name", "Nombre");
  const email = readOptionalText(formData, "email");
  const phone = readOptionalText(formData, "phone");
  const address = readOptionalText(formData, "address");
  const notes = readOptionalText(formData, "notes");

  const supabase = await createServerSupabaseClient();

  // Validate client belongs to org
  const { data: clientRow, error: lookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (lookupError || !clientRow) {
    backToEditWithError(clientId, "Cliente inválido para tu organización.");
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      display_name: displayName,
      email,
      phone,
      address,
      notes,
    })
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId);

  if (updateError) {
    backToEditWithError(clientId, "No pudimos guardar los cambios.");
  }

  redirect(`/app/clients/${clientId}`);
}

