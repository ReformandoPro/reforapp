import { Card } from "@/components/ui/Card";

export default function AppProjectDetailLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="h-5 w-32 rounded bg-bg-raised" />
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="h-7 w-2/3 rounded bg-bg-raised" />
        <div className="mt-3 h-4 w-1/3 rounded bg-bg-raised" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-16 rounded bg-bg-raised" />
          <div className="h-16 rounded bg-bg-raised" />
          <div className="h-16 rounded bg-bg-raised" />
          <div className="h-16 rounded bg-bg-raised" />
        </div>
      </Card>
    </section>
  );
}

