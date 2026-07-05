"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { validateProjectBudgetFormPayload } from "@/lib/services/project-budgets-validation";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/budgets/new`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

export async function createProjectBudgetAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/budgets/new`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToNewWithError(projectId, "No tienes permisos para crear presupuestos.");

  const validated = validateProjectBudgetFormPayload({
    title: formData.get("title"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    linesJson: formData.get("linesJson"),
  });

  if (!validated.ok) backToNewWithError(projectId, validated.message);

  const { title, status, notes, lines } = validated;

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

  const budgetId = crypto.randomUUID();

  const { error: insertBudgetError } = await supabase.from("project_budgets").insert({
    id: budgetId,
    organization_id: ctx.organizationId,
    project_id: projectId,
    title,
    status,
    notes,
  });

  if (insertBudgetError) {
    backToNewWithError(projectId, "No pudimos crear el presupuesto.");
  }

  const normalizedLines = lines.map((line, index) => ({
    id: crypto.randomUUID(),
    organization_id: ctx.organizationId,
    budget_id: budgetId,
    project_id: projectId,
    description: line.description,
    quantity: Number(line.quantity),
    unit_price: Number(line.unitPrice),
    tax_rate: Number(line.taxRate),
    sort_order: Number.isFinite(line.sortOrder) ? Number(line.sortOrder) : index + 1,
  }));

  const { error: insertLinesError } = await supabase
    .from("project_budget_lines")
    .insert(normalizedLines);

  if (insertLinesError) {
    // best-effort cleanup
    await supabase
      .from("project_budgets")
      .delete()
      .eq("organization_id", ctx.organizationId)
      .eq("project_id", projectId)
      .eq("id", budgetId);

    backToNewWithError(projectId, "No pudimos guardar las líneas.");
  }

  redirect(`/app/projects/${projectId}/budgets/${budgetId}`);
}
