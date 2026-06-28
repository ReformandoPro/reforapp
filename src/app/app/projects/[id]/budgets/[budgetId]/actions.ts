"use server";

import { redirect } from "next/navigation";

import type { BudgetStatus } from "@/lib/services/budgets-basic";
import { BUDGET_STATUSES } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToBudgetWithError(projectId: string, budgetId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/budgets/${budgetId}`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function normalizeStatus(projectId: string, budgetId: string, raw: string): BudgetStatus {
  const value = raw.trim() as BudgetStatus;
  if (!BUDGET_STATUSES.some((s) => s.value === value)) {
    backToBudgetWithError(projectId, budgetId, "Estado inválido.");
  }
  return value;
}

export async function updateBudgetStatusAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const budgetId = String(formData.get("budgetId") ?? "").trim();
  if (!projectId || !budgetId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/budgets/${budgetId}`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToBudgetWithError(projectId, budgetId, "No tienes permisos para cambiar el estado.");

  const status = normalizeStatus(projectId, budgetId, String(formData.get("status") ?? ""));

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToBudgetWithError(projectId, budgetId, "Obra inválida para tu organización.");
  }

  // Validate budget belongs to org + project.
  const { data: budgetRow, error: budgetError } = await supabase
    .from("project_budgets")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId)
    .maybeSingle();

  if (budgetError || !budgetRow) {
    backToBudgetWithError(projectId, budgetId, "Presupuesto inválido para esta obra.");
  }

  const { error: updateError } = await supabase
    .from("project_budgets")
    .update({ status })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId);

  if (updateError) {
    backToBudgetWithError(projectId, budgetId, "No pudimos actualizar el estado.");
  }

  redirect(`/app/projects/${projectId}/budgets/${budgetId}`);
}

export async function deleteBudgetAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const budgetId = String(formData.get("budgetId") ?? "").trim();
  if (!projectId || !budgetId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/budgets/${budgetId}`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToBudgetWithError(projectId, budgetId, "No tienes permisos para eliminar presupuestos.");

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToBudgetWithError(projectId, budgetId, "Obra inválida para tu organización.");
  }

  // Validate budget belongs to org + project.
  const { data: budgetRow, error: budgetError } = await supabase
    .from("project_budgets")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId)
    .maybeSingle();

  if (budgetError || !budgetRow) {
    backToBudgetWithError(projectId, budgetId, "Presupuesto inválido para esta obra.");
  }

  // Lines should be deleted by FK ON DELETE CASCADE (budget_id -> project_budgets).
  const { error: deleteError } = await supabase
    .from("project_budgets")
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId);

  if (deleteError) {
    backToBudgetWithError(projectId, budgetId, "No pudimos eliminar el presupuesto.");
  }

  redirect(`/app/projects/${projectId}/budgets`);
}
