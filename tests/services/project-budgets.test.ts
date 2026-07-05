import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  computeBudgetTotalsFromSupabaseLineTotalsRows,
  demoteOtherAcceptedBudgets,
  mapSupabaseBudgetLineRowToBudgetLineDomain,
  mapSupabaseBudgetLineTotalsRowToBudgetLineForTotals,
  selectMainBudget,
  selectMainBudgetId,
  type BudgetLineRow,
  type BudgetLineTotalsRow,
  type BudgetRow,
} from "../../src/lib/services/project-budgets";

describe("project-budgets service", () => {
  it("maps Supabase totals rows (snake_case) into BudgetLineForTotals (camelCase)", () => {
    const row: BudgetLineTotalsRow = {
      budget_id: "b1",
      quantity: "2",
      unit_price: "10",
      tax_rate: "21",
    };

    expect(mapSupabaseBudgetLineTotalsRowToBudgetLineForTotals(row)).toEqual({
      quantity: 2,
      unitPrice: 10,
      taxRate: 21,
    });
  });

  it("treats null/undefined/invalid numeric values as 0 when mapping totals rows", () => {
    const row: BudgetLineTotalsRow = {
      budget_id: "b1",
      quantity: null,
      unit_price: undefined,
      tax_rate: "nope",
    };

    expect(mapSupabaseBudgetLineTotalsRowToBudgetLineForTotals(row)).toEqual({
      quantity: 0,
      unitPrice: 0,
      taxRate: 0,
    });
  });

  it("computes totals from Supabase rows with quantity/unit_price/tax_rate", () => {
    const rows: BudgetLineTotalsRow[] = [
      { budget_id: "b1", quantity: 2, unit_price: 10, tax_rate: 21 },
    ];

    expect(computeBudgetTotalsFromSupabaseLineTotalsRows(rows)).toEqual({
      subtotal: 20,
      tax: 4.2,
      total: 24.2,
    });
  });

  it("returns zero totals for empty lines", () => {
    expect(computeBudgetTotalsFromSupabaseLineTotalsRows([])).toEqual({
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  });

  it("maps Supabase budget line rows into BudgetLineDomain", () => {
    const row: BudgetLineRow = {
      id: "l1",
      budget_id: "b1",
      description: "Demo",
      quantity: "3",
      unit_price: "12.5",
      tax_rate: 10,
      sort_order: 2,
    };

    expect(mapSupabaseBudgetLineRowToBudgetLineDomain(row)).toEqual({
      id: "l1",
      description: "Demo",
      quantity: 3,
      unitPrice: 12.5,
      taxRate: 10,
      sortOrder: 2,
    });
  });

  it("selects main budget preferring accepted, then first, else null", () => {
    const budgets: BudgetRow[] = [
      { id: "b1", title: "Draft", status: "draft", updated_at: "2026-01-01T00:00:00Z" },
      { id: "b2", title: "Accepted", status: "accepted", updated_at: "2026-01-02T00:00:00Z" },
      { id: "b3", title: "Sent", status: "sent", updated_at: "2026-01-03T00:00:00Z" },
    ];

    expect(selectMainBudgetId(budgets)).toBe("b2");
    expect(selectMainBudgetId(budgets.filter((b) => b.id !== "b2"))).toBe("b1");
    expect(selectMainBudgetId([])).toBeNull();

    expect(selectMainBudget(budgets)).toEqual({ kind: "accepted", budget: budgets[1] });
    expect(selectMainBudget(budgets.filter((b) => b.id !== "b2"))).toEqual({
      kind: "fallback",
      budget: budgets[0],
    });
    expect(selectMainBudget([])).toEqual({ kind: "none", budget: null });
  });

  it("demotes other accepted budgets when one becomes accepted", async () => {
    const neq = vi.fn().mockResolvedValue({ error: null });
    const eq3 = vi.fn(() => ({ neq }));
    const eq2 = vi.fn(() => ({ eq: eq3 }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ update }));

    const supabase = { from } as unknown as SupabaseClient;

    await expect(
      demoteOtherAcceptedBudgets(supabase, "org1", "project1", "keep1")
    ).resolves.toEqual({ ok: true, data: null });

    expect(from).toHaveBeenCalledWith("project_budgets");
    expect(update).toHaveBeenCalledWith({ status: "sent" });
    expect(eq1).toHaveBeenCalledWith("organization_id", "org1");
    expect(eq2).toHaveBeenCalledWith("project_id", "project1");
    expect(eq3).toHaveBeenCalledWith("status", "accepted");
    expect(neq).toHaveBeenCalledWith("id", "keep1");
  });

  it("fails when demoting accepted budgets errors", async () => {
    const neq = vi.fn().mockResolvedValue({ error: new Error("fail") });
    const eq3 = vi.fn(() => ({ neq }));
    const eq2 = vi.fn(() => ({ eq: eq3 }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ update }));

    const supabase = { from } as unknown as SupabaseClient;

    await expect(
      demoteOtherAcceptedBudgets(supabase, "org1", "project1", "keep1")
    ).resolves.toEqual({
      ok: false,
      message: "No pudimos actualizar el resto de presupuestos aceptados.",
    });
  });
});
