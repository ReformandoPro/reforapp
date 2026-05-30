import type { EntityId, MoneyAmount } from "./common";

export type BudgetLineKind =
  | "material"
  | "labor"
  | "subcontract"
  | "equipment"
  | "other";

export type BudgetLine = {
  id: EntityId;
  budgetId: EntityId;
  chapterId?: EntityId;
  code?: string;
  name: string;
  description?: string;
  kind: BudgetLineKind;
  quantity: number;
  unit: string;
  unitCost: MoneyAmount;
  wasteRate?: number;
  subtotalCost: MoneyAmount;
  marginRate?: number;
  salePrice: MoneyAmount;
  clientVisible: boolean;
};
