import { ReformistDashboardScreen } from "@/components/screens/ReformistDashboardScreen";
import { getDashboardSummary } from "@/lib/services/dashboard";

export default function Home() {
  const dashboardSummary = getDashboardSummary();

  return <ReformistDashboardScreen summary={dashboardSummary} />;
}
