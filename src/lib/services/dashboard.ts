import type { DashboardSummary } from "@/lib/types";

import { MockDashboardRepository } from "@/lib/repositories";

const dashboardRepository = new MockDashboardRepository();

export function getDashboardSummary(): DashboardSummary {
  return dashboardRepository.getDashboardSummary();
}
