import type { SupabaseClient } from "@supabase/supabase-js";

import {
  computeBudgetTotals,
  formatMoneyEUR,
  type BudgetStatus,
  type BudgetTotals,
  type BudgetLineInput,
} from "./budgets-basic";

export type BudgetRow = {
  id: string;
  title: string;
  status: BudgetStatus;
  notes?: string | null;
  updated_at?: string | null;
};

export type BudgetLineTotalsRow = {
  budget_id: string;
  quantity: string | number | null | undefined;
  unit_price: string | number | null | undefined;
  tax_rate: string | number | null | undefined;
};

export type BudgetLineRow = {
  id: string;
  budget_id: string;
  description: string;
  quantity: string | number | null | undefined;
  unit_price: string | number | null | undefined;
  tax_rate: string | number | null | undefined;
  sort_order: number | null | undefined;
};

export type BudgetLineForTotals = {
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type BudgetLineDomain = BudgetLineForTotals & {
  id: string;
  description: string;
  sortOrder: number;
};

export type BudgetSummary = {
  id: string;
  title: string;
  status: BudgetStatus;
  updatedAt: string | null;
  isMain: boolean;
  totals: BudgetTotals;
  formattedTotal: string;
};

export type BudgetDetail = {
  budget: {
    id: string;
    title: string;
    status: BudgetStatus;
    notes: string | null;
    updatedAt: string | null;
  };
  lines: BudgetLineDomain[];
  totals: BudgetTotals;
  formattedTotal: string;
};

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function toNumberOrZero(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapSupabaseBudgetLineTotalsRowToBudgetLineForTotals(
  row: BudgetLineTotalsRow
): BudgetLineForTotals {
  return {
    quantity: toNumberOrZero(row.quantity),
    unitPrice: toNumberOrZero(row.unit_price),
    taxRate: toNumberOrZero(row.tax_rate),
  };
}

export function mapSupabaseBudgetLineTotalsRowsToBudgetLinesForTotals(
  rows: BudgetLineTotalsRow[]
): BudgetLineForTotals[] {
  return rows.map(mapSupabaseBudgetLineTotalsRowToBudgetLineForTotals);
}

export function mapSupabaseBudgetLineRowToBudgetLineDomain(
  row: BudgetLineRow
): BudgetLineDomain {
  return {
    id: row.id,
    description: String(row.description ?? ""),
    quantity: toNumberOrZero(row.quantity),
    unitPrice: toNumberOrZero(row.unit_price),
    taxRate: toNumberOrZero(row.tax_rate),
    sortOrder: toNumberOrZero(row.sort_order),
  };
}

export function mapSupabaseBudgetLineRowsToBudgetLineDomain(
  rows: BudgetLineRow[]
): BudgetLineDomain[] {
  return rows.map(mapSupabaseBudgetLineRowToBudgetLineDomain);
}

export function computeBudgetTotalsFromSupabaseLineTotalsRows(
  rows: BudgetLineTotalsRow[]
): BudgetTotals {
  return computeBudgetTotals(
    mapSupabaseBudgetLineTotalsRowsToBudgetLinesForTotals(rows)
  );
}

export function computeBudgetTotalsFromSupabaseBudgetLineRows(
  rows: BudgetLineRow[]
): BudgetTotals {
  return computeBudgetTotals(
    rows.map((row) => ({
      quantity: toNumberOrZero(row.quantity),
      unitPrice: toNumberOrZero(row.unit_price),
      taxRate: toNumberOrZero(row.tax_rate),
    }))
  );
}

export function selectMainBudgetId(budgets: BudgetRow[]): string | null {
  const accepted = budgets.find((budget) => budget.status === "accepted");
  if (accepted) return accepted.id;
  return budgets[0]?.id ?? null;
}

export function mapBudgetLineDomainToBudgetLineInput(
  line: BudgetLineDomain
): BudgetLineInput {
  return {
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    taxRate: line.taxRate,
    sortOrder: line.sortOrder,
  };
}

export function mapBudgetLineDomainsToBudgetLineInputs(
  lines: BudgetLineDomain[]
): BudgetLineInput[] {
  return lines.map(mapBudgetLineDomainToBudgetLineInput);
}

export async function readProjectBudgetSummaries(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string
): Promise<ServiceResult<BudgetSummary[]>> {
  const { data: budgets, error: budgetsError } = await supabase
    .from("project_budgets")
    .select("id, title, status, updated_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (budgetsError) {
    return { ok: false, message: "No pudimos cargar los presupuestos." };
  }

  const budgetRows = (budgets ?? []) as BudgetRow[];
  const mainBudgetId = selectMainBudgetId(budgetRows);
  const budgetIds = budgetRows.map((budget) => budget.id);

  const { data: lines, error: linesError } = budgetIds.length
    ? await supabase
        .from("project_budget_lines")
        .select("budget_id, quantity, unit_price, tax_rate")
        .eq("organization_id", organizationId)
        .eq("project_id", projectId)
        .in("budget_id", budgetIds)
    : { data: [] as unknown[], error: null };

  // Keep the list experience resilient: if lines fail, keep showing headers.
  const lineRows = (linesError ? [] : (lines ?? [])) as BudgetLineTotalsRow[];
  const linesByBudget = new Map<string, BudgetLineTotalsRow[]>();
  for (const line of lineRows) {
    const list = linesByBudget.get(line.budget_id) ?? [];
    list.push(line);
    linesByBudget.set(line.budget_id, list);
  }

  const summaries: BudgetSummary[] = budgetRows.map((budget) => {
    const totals = computeBudgetTotalsFromSupabaseLineTotalsRows(
      linesByBudget.get(budget.id) ?? []
    );

    return {
      id: budget.id,
      title: budget.title,
      status: budget.status,
      updatedAt: budget.updated_at ?? null,
      isMain: mainBudgetId === budget.id,
      totals,
      formattedTotal: formatMoneyEUR(totals.total),
    };
  });

  return { ok: true, data: summaries };
}

export async function readProjectBudgetDetail(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
  budgetId: string
): Promise<ServiceResult<BudgetDetail | null>> {
  const { data: budget, error: budgetError } = await supabase
    .from("project_budgets")
    .select("id, title, status, notes, updated_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId)
    .maybeSingle();

  if (budgetError) {
    return { ok: false, message: "No pudimos cargar el presupuesto." };
  }

  if (!budget) return { ok: true, data: null };

  const { data: lines, error: linesError } = await supabase
    .from("project_budget_lines")
    .select("id, budget_id, description, quantity, unit_price, tax_rate, sort_order")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("budget_id", budgetId)
    .order("sort_order", { ascending: true });

  if (linesError) {
    return { ok: false, message: "No pudimos cargar las líneas." };
  }

  const budgetRow = budget as unknown as BudgetRow;
  const lineRows = (lines ?? []) as BudgetLineRow[];
  const domainLines = mapSupabaseBudgetLineRowsToBudgetLineDomain(lineRows);
  const totals = computeBudgetTotalsFromSupabaseBudgetLineRows(lineRows);

  return {
    ok: true,
    data: {
      budget: {
        id: budgetRow.id,
        title: budgetRow.title,
        status: budgetRow.status,
        notes: budgetRow.notes ?? null,
        updatedAt: budgetRow.updated_at ?? null,
      },
      lines: domainLines,
      totals,
      formattedTotal: formatMoneyEUR(totals.total),
    },
  };
}

export async function readProjectBudgetEditorState(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
  budgetId: string
): Promise<
  ServiceResult<{
    budget: { id: string; title: string; status: BudgetStatus; notes: string };
    initialLines: BudgetLineInput[];
  } | null>
> {
  const { data: budget, error: budgetError } = await supabase
    .from("project_budgets")
    .select("id, title, status, notes")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId)
    .maybeSingle();

  if (budgetError) {
    return { ok: false, message: "No pudimos cargar el presupuesto." };
  }

  if (!budget) return { ok: true, data: null };

  const { data: lines, error: linesError } = await supabase
    .from("project_budget_lines")
    .select("id, budget_id, description, quantity, unit_price, tax_rate, sort_order")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("budget_id", budgetId)
    .order("sort_order", { ascending: true });

  if (linesError) {
    return { ok: false, message: "No pudimos cargar las líneas." };
  }

  const lineRows = (lines ?? []) as BudgetLineRow[];
  const domainLines = mapSupabaseBudgetLineRowsToBudgetLineDomain(lineRows);
  const initialLines =
    domainLines.length > 0
      ? mapBudgetLineDomainsToBudgetLineInputs(domainLines)
      : [{ description: "", quantity: 1, unitPrice: 0, taxRate: 21, sortOrder: 1 }];

  const budgetRow = budget as unknown as BudgetRow;

  return {
    ok: true,
    data: {
      budget: {
        id: budgetRow.id,
        title: budgetRow.title,
        status: budgetRow.status,
        notes: String(budgetRow.notes ?? ""),
      },
      initialLines,
    },
  };
}

export async function readMainProjectBudgetSummary(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string
): Promise<
  ServiceResult<
    | {
        id: string;
        title: string;
        status: BudgetStatus;
        totals: BudgetTotals;
        formattedTotal: string;
      }
    | null
  >
> {
  const { data: budgets, error: budgetsError } = await supabase
    .from("project_budgets")
    .select("id, title, status, updated_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (budgetsError) {
    return { ok: false, message: "No pudimos cargar los presupuestos." };
  }

  const budgetRows = (budgets ?? []) as BudgetRow[];
  const mainBudget = budgetRows.find((budget) => budget.status === "accepted") ?? budgetRows[0] ?? null;

  if (!mainBudget) return { ok: true, data: null };

  const { data: lines, error: linesError } = await supabase
    .from("project_budget_lines")
    .select("budget_id, quantity, unit_price, tax_rate")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("budget_id", mainBudget.id);

  if (linesError) {
    return { ok: false, message: "No pudimos cargar las líneas del presupuesto." };
  }

  const totals = computeBudgetTotalsFromSupabaseLineTotalsRows((lines ?? []) as BudgetLineTotalsRow[]);

  return {
    ok: true,
    data: {
      id: mainBudget.id,
      title: mainBudget.title,
      status: mainBudget.status,
      totals,
      formattedTotal: formatMoneyEUR(totals.total),
    },
  };
}

export async function readAcceptedBudgetsTotals(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string
): Promise<ServiceResult<{ hasAcceptedBudget: boolean; totals: BudgetTotals }>> {
  const { data: acceptedBudgets, error: acceptedBudgetsError } = await supabase
    .from("project_budgets")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("status", "accepted");

  if (acceptedBudgetsError) {
    return { ok: false, message: "No pudimos cargar los presupuestos aceptados." };
  }

  const acceptedIds = (acceptedBudgets ?? []).map((row: { id: string }) => String(row.id));
  if (acceptedIds.length === 0) {
    return {
      ok: true,
      data: { hasAcceptedBudget: false, totals: computeBudgetTotals([]) },
    };
  }

  const { data: acceptedLines, error: acceptedLinesError } = await supabase
    .from("project_budget_lines")
    .select("budget_id, quantity, unit_price, tax_rate")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .in("budget_id", acceptedIds);

  const lineRows = (acceptedLinesError ? [] : (acceptedLines ?? [])) as BudgetLineTotalsRow[];
  const totals = computeBudgetTotalsFromSupabaseLineTotalsRows(lineRows);

  return { ok: true, data: { hasAcceptedBudget: true, totals } };
}
