import type { MainBudgetKind } from "./project-budgets";

export type ProjectMarginStatus = "healthy" | "risk" | "loss" | "unknown";

export type ProjectMarginInput = {
  budgetTotal: number;
  realCostTotal: number;
  budgetKind: MainBudgetKind;
};

export type ProjectMargin = {
  budgetTotal: number;
  realCostTotal: number;
  marginAmount: number;
  marginPercent: number | null;
  status: ProjectMarginStatus;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toFiniteNumberOrZero(value: unknown): number {
  const asNumber = typeof value === "number" ? value : Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

export function computeProjectMargin(input: ProjectMarginInput): ProjectMargin {
  const budgetTotal = toFiniteNumberOrZero(input.budgetTotal);
  const realCostTotal = toFiniteNumberOrZero(input.realCostTotal);
  const marginAmount = round2(budgetTotal - realCostTotal);

  if (input.budgetKind !== "accepted" || budgetTotal <= 0) {
    return {
      budgetTotal,
      realCostTotal,
      marginAmount,
      marginPercent: null,
      status: "unknown",
    };
  }

  const marginPercent = round2((marginAmount / budgetTotal) * 100);

  if (marginAmount < 0) {
    return { budgetTotal, realCostTotal, marginAmount, marginPercent, status: "loss" };
  }

  if (marginPercent >= 20) {
    return { budgetTotal, realCostTotal, marginAmount, marginPercent, status: "healthy" };
  }

  return { budgetTotal, realCostTotal, marginAmount, marginPercent, status: "risk" };
}

