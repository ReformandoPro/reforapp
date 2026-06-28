"use server";

import { redirect } from "next/navigation";

import { COST_CATEGORIES, type CostCategory } from "@/lib/services/costs";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(projectId: string, costId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/costs/${costId}/edit`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function normalizeCategory(projectId: string, costId: string, raw: string): CostCategory {
  const value = raw.trim() as CostCategory;
  if (!COST_CATEGORIES.some((c) => c.value === value)) {
    backToEditWithError(projectId, costId, "Categoría inválida.");
  }
  return value;
}

function parseNumber(projectId: string, costId: string, raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(n)) backToEditWithError(projectId, costId, "Número inválido.");
  return n;
}

export async function updateProjectCostAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const costId = String(formData.get("costId") ?? "").trim();
  if (!projectId || !costId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/costs/${costId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, costId, "No tienes permisos para editar costes.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToEditWithError(projectId, costId, "Título es obligatorio.");

  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw.length > 0 ? descriptionRaw : null;

  const category = normalizeCategory(projectId, costId, String(formData.get("category") ?? "other"));

  const amount = parseNumber(projectId, costId, formData.get("amount"));
  if (amount < 0) backToEditWithError(projectId, costId, "Importe debe ser >= 0.");

  const taxRate = parseNumber(projectId, costId, formData.get("taxRate"));
  if (taxRate < 0 || taxRate > 100) backToEditWithError(projectId, costId, "IVA inválido.");

  const costDate = String(formData.get("costDate") ?? "").trim();
  if (!costDate) backToEditWithError(projectId, costId, "Fecha es obligatoria.");

  const supplierNameRaw = String(formData.get("supplierName") ?? "").trim();
  const supplier_name = supplierNameRaw.length > 0 ? supplierNameRaw : null;

  const documentIdRaw = String(formData.get("documentId") ?? "").trim();
  const document_id = documentIdRaw.length > 0 ? documentIdRaw : null;

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToEditWithError(projectId, costId, "Obra inválida para tu organización.");
  }

  // Validate cost belongs to org + project.
  const { data: costRow, error: costError } = await supabase
    .from("project_costs")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", costId)
    .maybeSingle();

  if (costError || !costRow) {
    backToEditWithError(projectId, costId, "Coste inválido para esta obra.");
  }

  // If provided, validate document belongs to same org + project.
  if (document_id) {
    const { data: docRow, error: docError } = await supabase
      .from("project_documents")
      .select("id")
      .eq("organization_id", ctx.organizationId)
      .eq("project_id", projectId)
      .eq("id", document_id)
      .maybeSingle();

    if (docError || !docRow) {
      backToEditWithError(projectId, costId, "Documento inválido para esta obra.");
    }
  }

  const { error: updateError } = await supabase
    .from("project_costs")
    .update({
      title,
      description,
      category,
      amount,
      tax_rate: taxRate,
      cost_date: costDate,
      supplier_name,
      document_id,
    })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", costId);

  if (updateError) {
    backToEditWithError(projectId, costId, "No pudimos guardar el coste.");
  }

  redirect(`/app/projects/${projectId}/costs`);
}

export async function deleteProjectCostAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const costId = String(formData.get("costId") ?? "").trim();
  if (!projectId || !costId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/costs/${costId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, costId, "No tienes permisos para eliminar costes.");

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToEditWithError(projectId, costId, "Obra inválida para tu organización.");
  }

  // Validate cost belongs to org + project.
  const { data: costRow, error: costError } = await supabase
    .from("project_costs")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", costId)
    .maybeSingle();

  if (costError || !costRow) {
    backToEditWithError(projectId, costId, "Coste inválido para esta obra.");
  }

  const { error: deleteError } = await supabase
    .from("project_costs")
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", costId);

  if (deleteError) {
    backToEditWithError(projectId, costId, "No pudimos eliminar el coste.");
  }

  redirect(`/app/projects/${projectId}/costs`);
}
