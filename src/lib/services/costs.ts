export type CostCategory =
  | "labor"
  | "material"
  | "subcontractor"
  | "transport"
  | "permit"
  | "tool"
  | "other";

export const COST_CATEGORIES: { value: CostCategory; label: string }[] = [
  { value: "labor", label: "Mano de obra" },
  { value: "material", label: "Material" },
  { value: "subcontractor", label: "Subcontrata" },
  { value: "transport", label: "Transporte" },
  { value: "permit", label: "Licencias" },
  { value: "tool", label: "Herramientas" },
  { value: "other", label: "Otros" },
];

export type CostTotals = {
  base: number;
  tax: number;
  total: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeCostTotals(rows: Array<{ amount: number; taxRate: number }>): CostTotals {
  let base = 0;
  let tax = 0;

  for (const row of rows) {
    base += row.amount;
    tax += row.amount * (row.taxRate / 100);
  }

  base = round2(base);
  tax = round2(tax);

  return {
    base,
    tax,
    total: round2(base + tax),
  };
}
