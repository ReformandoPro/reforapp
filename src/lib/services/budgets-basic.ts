export type BudgetStatus = "draft" | "sent" | "accepted" | "rejected";

export const BUDGET_STATUSES: { value: BudgetStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviado" },
  { value: "accepted", label: "Aceptado" },
  { value: "rejected", label: "Rechazado" },
];

export type BudgetLineInput = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  sortOrder: number;
};

export type BudgetTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeBudgetTotals(lines: Array<{ quantity: number; unitPrice: number; taxRate: number }>): BudgetTotals {
  let subtotal = 0;
  let tax = 0;

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.unitPrice;
    subtotal += lineSubtotal;
    tax += lineSubtotal * (line.taxRate / 100);
  }

  subtotal = round2(subtotal);
  tax = round2(tax);

  return {
    subtotal,
    tax,
    total: round2(subtotal + tax),
  };
}

export function formatMoneyEUR(value: number): string {
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} €`;
  }
}
