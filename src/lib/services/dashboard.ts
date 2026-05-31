import { createDashboardRepository } from "@/lib/application";
import type { DashboardSummary } from "@/lib/types";

const dashboardRepository = createDashboardRepository({ dataSource: "mock" });

export function getDashboardSummary(): DashboardSummary {
  return dashboardRepository.getDashboardSummary();
}
