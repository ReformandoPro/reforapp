export type PurchaseStatus = "planned" | "ordered" | "received" | "cancelled";

export const PURCHASE_STATUSES: { value: PurchaseStatus; label: string }[] = [
  { value: "planned", label: "Planificado" },
  { value: "ordered", label: "Pedido" },
  { value: "received", label: "Recibido" },
  { value: "cancelled", label: "Cancelado" },
];

export type PurchaseItemInput = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  sortOrder: number;
};

export type PurchaseTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computePurchaseTotals(
  items: Array<{ quantity: number; unitPrice: number; taxRate: number }>
): PurchaseTotals {
  let subtotal = 0;
  let tax = 0;

  for (const item of items) {
    const lineSubtotal = item.quantity * item.unitPrice;
    subtotal += lineSubtotal;
    tax += lineSubtotal * (item.taxRate / 100);
  }

  subtotal = round2(subtotal);
  tax = round2(tax);

  return {
    subtotal,
    tax,
    total: round2(subtotal + tax),
  };
}
