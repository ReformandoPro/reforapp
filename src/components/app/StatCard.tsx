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
    <Card padding="lg" shadow="none">
      <p className="text-sm font-medium text-content-secondary">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {helper ? <p className="mt-2 text-sm text-content-tertiary">{helper}</p> : null}
    </Card>
  );
}
