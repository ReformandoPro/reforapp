import { Card } from "@/components/ui/Card";

function SkeletonCard() {
  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-5 w-2/3 rounded bg-bg-raised" />
          <div className="mt-3 h-4 w-1/3 rounded bg-bg-raised" />
        </div>
        <div className="h-6 w-24 rounded bg-bg-raised" />
      </div>
    </Card>
  );
}

export default function AppProjectsLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="h-7 w-56 rounded bg-bg-raised" />
        <div className="mt-3 h-4 w-2/3 rounded bg-bg-raised" />
      </Card>

      <div className="grid gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}

