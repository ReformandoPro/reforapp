"use server";

import { redirect } from "next/navigation";

import type { BudgetLineInput, BudgetStatus } from "@/lib/services/budgets-basic";
import { BUDGET_STATUSES } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/budgets/new`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function parseLinesJson(projectId: string, raw: string | null): BudgetLineInput[] {
  if (!raw) backToNewWithError(projectId, "Faltan líneas.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backToNewWithError(projectId, "Líneas inválidas.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    backToNewWithError(projectId, "Debe existir al menos una línea.");
  }

  return parsed as BudgetLineInput[];
}

function normalizeStatus(projectId: string, raw: string): BudgetStatus {
  const value = raw.trim() as BudgetStatus;
  if (!BUDGET_STATUSES.some((s) => s.value === value)) {
    backToNewWithError(projectId, "Estado inválido.");
  }
  return value;
}

export async function createProjectBudgetAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/budgets/new`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToNewWithError(projectId, "No tienes permisos para crear presupuestos.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToNewWithError(projectId, "Título es obligatorio.");

  const status = normalizeStatus(projectId, String(formData.get("status") ?? "draft"));
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  const lines = parseLinesJson(projectId, String(formData.get("linesJson") ?? null));

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

  const normalizedLines = lines
    .map((line, index) => {
      const description = String(line.description ?? "").trim();
      return {
        id: crypto.randomUUID(),
        organization_id: ctx.organizationId,
        budget_id: budgetId,
        project_id: projectId,
        description,
        quantity: Number(line.quantity ?? 0),
        unit_price: Number(line.unitPrice ?? 0),
        tax_rate: Number(line.taxRate ?? 21),
        sort_order: Number.isFinite(line.sortOrder) ? Number(line.sortOrder) : index + 1,
      };
    })
    .filter((l) => l.description.length > 0);

  if (normalizedLines.length === 0) {
    backToNewWithError(projectId, "Debe existir al menos una línea con concepto.");
  }

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
