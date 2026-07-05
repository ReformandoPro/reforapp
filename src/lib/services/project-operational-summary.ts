import type { SupabaseClient } from "@supabase/supabase-js";

import { computeBudgetTotals, formatMoneyEUR, type BudgetStatus } from "./budgets-basic";
import { computeCostTotals } from "./costs";
import type { PurchaseStatus } from "./purchases";

type BlockResult<T> =
  | { status: "ready"; data: T }
  | { status: "error"; message: string };

type TaskRow = { id: string; title: string; status: string; due_date: string | null; updated_at: string | null };
type PhaseRow = { id: string; title: string; status: string; start_date: string | null; end_date: string | null; sort_order: number | null };
type BudgetRow = { id: string; title: string; status: BudgetStatus; updated_at: string | null };
type BudgetLineRow = { budget_id: string; quantity: number; unit_price: number; tax_rate: number };
type PurchaseRow = { id: string; title: string; supplier_name: string | null; status: PurchaseStatus; expected_date: string | null; updated_at: string | null };
type CostRow = { id: string; amount: number; tax_rate: number; cost_date: string; created_at: string };
type DocumentRow = { id: string; file_name: string; category: string; created_at: string };
type ProgressRow = { id: string; progress: number; note: string | null; created_at: string };

export type ProjectOperationalSummary = {
  tasks: BlockResult<{
    open: number;
    inProgress: number;
    completed: number;
    next: Array<Pick<TaskRow, "id" | "title" | "status" | "due_date">>;
  }>;
  phases: BlockResult<{
    count: number;
    current: Pick<PhaseRow, "id" | "title" | "status"> | null;
  }>;
  budget: BlockResult<{
    main: { id: string; title: string; status: BudgetStatus; total: number; formattedTotal: string } | null;
  }>;
  costs: BlockResult<{
    total: number;
    formattedTotal: string;
  }>;
  purchases: BlockResult<{
    pending: number;
    latest: Array<Pick<PurchaseRow, "id" | "title" | "supplier_name" | "status" | "expected_date">>;
  }>;
  documents: BlockResult<{
    count: number;
    latest: Array<Pick<DocumentRow, "id" | "file_name" | "category" | "created_at">>;
  }>;
  progress: BlockResult<{
    current: number;
    latest: Pick<ProgressRow, "id" | "progress" | "note" | "created_at"> | null;
  }>;
};

function blockError(message: string): { status: "error"; message: string } {
  return { status: "error", message };
}

async function readTasks(supabase: SupabaseClient, organizationId: string, projectId: string): Promise<ProjectOperationalSummary["tasks"]> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select("id, title, status, due_date, updated_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as TaskRow[];
  return {
    status: "ready",
    data: {
      open: rows.filter((task) => task.status === "pending" || task.status === "blocked").length,
      inProgress: rows.filter((task) => task.status === "in_progress").length,
      completed: rows.filter((task) => task.status === "done").length,
      next: rows.filter((task) => task.status !== "done").slice(0, 3),
    },
  };
}

async function readPhases(supabase: SupabaseClient, organizationId: string, projectId: string): Promise<ProjectOperationalSummary["phases"]> {
  const { data, error } = await supabase
    .from("project_phases")
    .select("id, title, status, start_date, end_date, sort_order")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as PhaseRow[];
  const current = rows.find((phase) => phase.status === "in_progress") ?? rows.find((phase) => phase.status === "planned") ?? null;

  return { status: "ready", data: { count: rows.length, current } };
}

async function readBudget(supabase: SupabaseClient, organizationId: string, projectId: string): Promise<ProjectOperationalSummary["budget"]> {
  const { data: budgets, error: budgetsError } = await supabase
    .from("project_budgets")
    .select("id, title, status, updated_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (budgetsError) throw budgetsError;

  const budgetRows = (budgets ?? []) as BudgetRow[];
  const mainBudget = budgetRows.find((budget) => budget.status === "accepted") ?? budgetRows[0] ?? null;

  if (!mainBudget) return { status: "ready", data: { main: null } };

  const { data: lines, error: linesError } = await supabase
    .from("project_budget_lines")
    .select("budget_id, quantity, unit_price, tax_rate")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("budget_id", mainBudget.id);

  if (linesError) throw linesError;

  const budgetLines = (lines ?? []) as BudgetLineRow[];
  const totals = computeBudgetTotals(
    budgetLines.map((line) => ({
      quantity: Number(line.quantity ?? 0),
      unitPrice: Number(line.unit_price ?? 0),
      taxRate: Number(line.tax_rate ?? 0),
    })),
  );
  return {
    status: "ready",
    data: {
      main: {
        id: mainBudget.id,
        title: mainBudget.title,
        status: mainBudget.status,
        total: totals.total,
        formattedTotal: formatMoneyEUR(totals.total),
      },
    },
  };
}

async function readCosts(supabase: SupabaseClient, organizationId: string, projectId: string): Promise<ProjectOperationalSummary["costs"]> {
  const { data, error } = await supabase
    .from("project_costs")
    .select("id, amount, tax_rate, cost_date, created_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("cost_date", { ascending: false });

  if (error) throw error;

  const costRows = (data ?? []) as CostRow[];
  const totals = computeCostTotals(
    costRows.map((row) => ({
      amount: Number(row.amount ?? 0),
      taxRate: Number(row.tax_rate ?? 0),
    })),
  );
  return { status: "ready", data: { total: totals.total, formattedTotal: formatMoneyEUR(totals.total) } };
}

async function readPurchases(supabase: SupabaseClient, organizationId: string, projectId: string): Promise<ProjectOperationalSummary["purchases"]> {
  const { data, error } = await supabase
    .from("project_purchases")
    .select("id, title, supplier_name, status, expected_date, updated_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as PurchaseRow[];
  return {
    status: "ready",
    data: {
      pending: rows.filter((purchase) => purchase.status === "planned" || purchase.status === "ordered").length,
      latest: rows.slice(0, 3),
    },
  };
}

async function readDocuments(supabase: SupabaseClient, organizationId: string, projectId: string): Promise<ProjectOperationalSummary["documents"]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("id, file_name, category, created_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as DocumentRow[];
  return { status: "ready", data: { count: rows.length, latest: rows.slice(0, 3) } };
}

async function readProgress(supabase: SupabaseClient, organizationId: string, projectId: string, currentProgress: number): Promise<ProjectOperationalSummary["progress"]> {
  const { data, error } = await supabase
    .from("project_progress_updates")
    .select("id, progress, note, created_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  const latest = ((data ?? []) as ProgressRow[])[0] ?? null;
  return { status: "ready", data: { current: currentProgress, latest } };
}

async function safeBlock<T>(label: string, fn: () => Promise<BlockResult<T>>, message: string): Promise<BlockResult<T>> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Project operational summary ${label} query failed`, error);
    return blockError(message);
  }
}

export async function getProjectOperationalSummary(params: {
  supabase: SupabaseClient;
  organizationId: string;
  projectId: string;
  currentProgress: number;
}): Promise<ProjectOperationalSummary> {
  const { supabase, organizationId, projectId, currentProgress } = params;

  const [tasks, phases, budget, costs, purchases, documents, progress] = await Promise.all([
    safeBlock("tasks", () => readTasks(supabase, organizationId, projectId), "No se pudieron cargar las tareas."),
    safeBlock("phases", () => readPhases(supabase, organizationId, projectId), "No se pudieron cargar las fases."),
    safeBlock("budget", () => readBudget(supabase, organizationId, projectId), "No se pudo cargar el presupuesto."),
    safeBlock("costs", () => readCosts(supabase, organizationId, projectId), "No se pudieron cargar los costes."),
    safeBlock("purchases", () => readPurchases(supabase, organizationId, projectId), "No se pudieron cargar las compras."),
    safeBlock("documents", () => readDocuments(supabase, organizationId, projectId), "No se pudieron cargar los documentos."),
    safeBlock("progress", () => readProgress(supabase, organizationId, projectId, currentProgress), "No se pudo cargar el último avance."),
  ]);

  return { tasks, phases, budget, costs, purchases, documents, progress };
}
