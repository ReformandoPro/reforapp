import type { EntityId, MoneyAmount, AuditFields, OrganizationScoped } from "./common";
import type { BudgetStatus } from "@/lib/domain/budgets/status";
import type { BudgetLine } from "./budget-line";

export type BudgetDetail = AuditFields &
  OrganizationScoped & {
    id: EntityId;
    projectId: EntityId;
    versionId?: EntityId;
    code?: string;
    title: string;
    description?: string;
    status: BudgetStatus;
    currency: string;
    surfaceSquareMeters?: number;
    estimatedCost: MoneyAmount;
    salePrice: MoneyAmount;
    targetMarginRate: number;
    actualMarginRate: number;
    contingencyAmount: MoneyAmount;
    clientVisibleTotal: MoneyAmount;
    lines: BudgetLine[];
  };
