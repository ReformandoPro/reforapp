import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Card className="relative overflow-hidden" padding="lg" variant="raised">
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary-500/10 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">{label}</p>
      <p className="mt-4 font-num text-3xl font-bold tracking-tight text-content-primary sm:text-4xl">{value}</p>
      {helper ? <p className="mt-3 text-sm leading-5 text-content-secondary">{helper}</p> : null}
    </Card>
  );
}
