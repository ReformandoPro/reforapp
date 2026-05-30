import { mockDashboardSummary } from "@/lib/mock/dashboard";

import type { DashboardRepository } from "./dashboard-repository";

export class MockDashboardRepository implements DashboardRepository {
  getDashboardSummary() {
    return mockDashboardSummary;
  }
}
