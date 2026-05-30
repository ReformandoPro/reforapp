import type { DashboardSummary } from "@/lib/types";

export interface DashboardRepository {
  getDashboardSummary(): DashboardSummary;
}
