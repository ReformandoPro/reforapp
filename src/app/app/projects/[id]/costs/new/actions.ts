"use server";

import { redirect } from "next/navigation";

import { COST_CATEGORIES, type CostCategory } from "@/lib/services/costs";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/costs/new`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function normalizeCategory(projectId: string, raw: string): CostCategory {
  const value = raw.trim() as CostCategory;
  if (!COST_CATEGORIES.some((c) => c.value === value)) {
    backToNewWithError(projectId, "Categoría inválida.");
  }
  return value;
}

function parseNumber(projectId: string, raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(n)) backToNewWithError(projectId, "Número inválido.");
  return n;
}

export async function createProjectCostAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/costs/new`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToNewWithError(projectId, "No tienes permisos para crear costes.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToNewWithError(projectId, "Título es obligatorio.");

  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw.length > 0 ? descriptionRaw : null;

  const category = normalizeCategory(projectId, String(formData.get("category") ?? "other"));

  const amount = parseNumber(projectId, formData.get("amount"));
  if (amount < 0) backToNewWithError(projectId, "Importe debe ser >= 0.");

  const taxRate = parseNumber(projectId, formData.get("taxRate"));
  if (taxRate < 0 || taxRate > 100) backToNewWithError(projectId, "IVA inválido.");

  const costDate = String(formData.get("costDate") ?? "").trim();
  if (!costDate) backToNewWithError(projectId, "Fecha es obligatoria.");

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
    backToNewWithError(projectId, "Obra inválida para tu organización.");
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
      backToNewWithError(projectId, "Documento inválido para esta obra.");
    }
  }

  const { error: insertError } = await supabase.from("project_costs").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    created_by_user_id: ctx.user.id,
    title,
    description,
    category,
    amount,
    tax_rate: taxRate,
    cost_date: costDate,
    supplier_name,
    document_id,
  });

  if (insertError) {
    backToNewWithError(projectId, "No pudimos crear el coste.");
  }

  redirect(`/app/projects/${projectId}/costs`);
}
