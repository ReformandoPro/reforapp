"use server";

import { redirect } from "next/navigation";

import { formatMoneyEUR } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import type { PurchaseStatus } from "@/lib/services/purchases";
import { PURCHASE_STATUSES, computePurchaseTotals } from "@/lib/services/purchases";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToPurchaseWithError(projectId: string, purchaseId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/purchases/${purchaseId}`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function normalizeStatus(projectId: string, purchaseId: string, raw: string): PurchaseStatus {
  const value = raw.trim() as PurchaseStatus;
  if (!PURCHASE_STATUSES.some((s) => s.value === value)) {
    backToPurchaseWithError(projectId, purchaseId, "Estado inválido.");
  }
  return value;
}

export async function updatePurchaseStatusAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  if (!projectId || !purchaseId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/purchases/${purchaseId}`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToPurchaseWithError(projectId, purchaseId, "No tienes permisos para cambiar el estado.");

  const status = normalizeStatus(projectId, purchaseId, String(formData.get("status") ?? ""));

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToPurchaseWithError(projectId, purchaseId, "Obra inválida para tu organización.");
  }

  // Validate purchase belongs to org + project.
  const { data: purchaseRow, error: purchaseError } = await supabase
    .from("project_purchases")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError || !purchaseRow) {
    backToPurchaseWithError(projectId, purchaseId, "Pedido inválido para esta obra.");
  }

  const patch: { status: PurchaseStatus; received_date?: string | null } = { status };
  if (status === "received") {
    const today = new Date().toISOString().slice(0, 10);
    patch.received_date = today;
  }

  const { error: updateError } = await supabase
    .from("project_purchases")
    .update(patch)
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId);

  if (updateError) {
    backToPurchaseWithError(projectId, purchaseId, "No pudimos actualizar el estado.");
  }

  redirect(`/app/projects/${projectId}/purchases/${purchaseId}`);
}

export async function deletePurchaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  if (!projectId || !purchaseId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/purchases/${purchaseId}`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToPurchaseWithError(projectId, purchaseId, "No tienes permisos para eliminar pedidos.");

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToPurchaseWithError(projectId, purchaseId, "Obra inválida para tu organización.");
  }

  // Validate purchase belongs to org + project.
  const { data: purchaseRow, error: purchaseError } = await supabase
    .from("project_purchases")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError || !purchaseRow) {
    backToPurchaseWithError(projectId, purchaseId, "Pedido inválido para esta obra.");
  }

  // Items deleted by FK ON DELETE CASCADE.
  const { error: deleteError } = await supabase
    .from("project_purchases")
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId);

  if (deleteError) {
    backToPurchaseWithError(projectId, purchaseId, "No pudimos eliminar el pedido.");
  }

  redirect(`/app/projects/${projectId}/purchases`);
}

export async function createCostFromPurchaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  if (!projectId || !purchaseId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/purchases/${purchaseId}`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToPurchaseWithError(projectId, purchaseId, "No tienes permisos para crear costes.");

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToPurchaseWithError(projectId, purchaseId, "Obra inválida para tu organización.");
  }

  // Load purchase header (belongs to org+project).
  const { data: purchase, error: purchaseError } = await supabase
    .from("project_purchases")
    .select("id, title, supplier_name")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError || !purchase) {
    backToPurchaseWithError(projectId, purchaseId, "Pedido inválido para esta obra.");
  }

  // Load items.
  const { data: items, error: itemsError } = await supabase
    .from("project_purchase_items")
    .select("quantity, unit_price, tax_rate")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("purchase_id", purchaseId);

  if (itemsError) {
    backToPurchaseWithError(projectId, purchaseId, "No pudimos cargar las líneas del pedido.");
  }

  const itemRows = (items ?? []) as Array<{ quantity: string | number; unit_price: string | number; tax_rate: string | number }>;
  const totals = computePurchaseTotals(
    itemRows.map((i) => ({
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      taxRate: Number(i.tax_rate),
    }))
  );

  if (totals.subtotal <= 0) {
    backToPurchaseWithError(projectId, purchaseId, "Este pedido no tiene subtotal válido para crear un coste.");
  }

  const uniqueTaxRates = Array.from(new Set(itemRows.map((i) => Number(i.tax_rate))));
  const chosenTaxRate = uniqueTaxRates.length === 1 ? uniqueTaxRates[0] : 21;

  const note =
    uniqueTaxRates.length === 1
      ? null
      : `Coste creado desde pedido con IVA mixto (${uniqueTaxRates.join(", ")}%). Se aplicó 21% por defecto. Total pedido: ${formatMoneyEUR(
          totals.total
        )}.`;

  const { error: insertCostError } = await supabase.from("project_costs").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    created_by_user_id: ctx.user.id,
    title: purchase.title,
    description: note,
    category: "material",
    amount: totals.subtotal,
    tax_rate: chosenTaxRate,
    supplier_name: purchase.supplier_name,
  });

  if (insertCostError) {
    backToPurchaseWithError(projectId, purchaseId, "No pudimos crear el coste desde el pedido.");
  }

  redirect(`/app/projects/${projectId}/costs`);
}
