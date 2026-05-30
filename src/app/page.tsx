import { AppShell } from "@/components/screens/AppShell";
import { BudgetSummaryScreen } from "@/components/screens/BudgetSummaryScreen";
import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { ReformistDashboardScreen } from "@/components/screens/ReformistDashboardScreen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getBudgetSummary } from "@/lib/services/budgets";
import { getDashboardSummary } from "@/lib/services/dashboard";
import { getProjectOverview } from "@/lib/services/projects";

const placeholderLinks = ["Dashboard", "Obra", "Presupuesto"];

export default function Home() {
  const dashboardSummary = getDashboardSummary();
  const projectOverview = getProjectOverview("project_obra_centro");
  const budgetSummary = getBudgetSummary("budget_obra_centro_v1");

  if (!projectOverview || !budgetSummary) {
    throw new Error("Missing temporary UI data contracts");
  }

  return (
    <AppShell>
      <Card className="bg-slate-900 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="bg-white/10 text-white" tone="info">
              MVP técnico en marcha
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reformando.app
            </h2>
            <p className="mt-3 text-lg text-slate-200">
              El sistema operativo para empresas de reformas.
            </p>
            <p className="mt-4 text-sm text-slate-300">
              Proyecto en fase inicial. Core técnico preparado por Openclaw.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {placeholderLinks.map((link) => (
              <Button key={link} variant="secondary">
                {link}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <ReformistDashboardScreen summary={dashboardSummary} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectOverviewScreen project={projectOverview} />
        <BudgetSummaryScreen budget={budgetSummary} />
      </div>
    </AppShell>
  );
}
