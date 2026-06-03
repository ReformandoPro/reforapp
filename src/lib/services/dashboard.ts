import { getDashboardSummary as getDashboardSummaryFromData } from "@/lib/data";
import type { DashboardSummary } from "@/lib/types";

export function getDashboardSummary(): DashboardSummary {
  return getDashboardSummaryFromData();
}
