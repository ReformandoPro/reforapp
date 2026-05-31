import Link from "next/link";

import { BudgetSummaryScreen } from "@/components/screens/BudgetSummaryScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBudgetSummary } from "@/lib/services/budgets";

type BudgetDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BudgetDetailPage({
  params,
}: BudgetDetailPageProps) {
  const { id } = await params;
  const budget = getBudgetSummary(id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/budgets"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Volver a presupuestos
      </Link>

      {budget ? (
        <BudgetSummaryScreen budget={budget} />
      ) : (
        <EmptyState
          title="Presupuesto no encontrado"
          description="No hemos encontrado un presupuesto con este identificador."
        />
      )}
    </section>
  );
}
