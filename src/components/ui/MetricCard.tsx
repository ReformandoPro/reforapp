import type { HTMLAttributes } from "react";

import { Card } from "./Card";
import { cn } from "./cn";

type MetricCardTone = "neutral" | "info" | "success" | "warning" | "danger";

type MetricCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string | number;
  description?: string;
  tone?: MetricCardTone;
};

const toneClasses: Record<MetricCardTone, string> = {
  neutral: "border-subtle",
  info: "border-primary-500",
  success: "border-success-500",
  warning: "border-warning-500",
  danger: "border-danger-500",
};

const accentClasses: Record<MetricCardTone, string> = {
  neutral: "before:bg-content-tertiary",
  info: "before:bg-primary-500",
  success: "before:bg-success-500",
  warning: "before:bg-warning-500",
  danger: "before:bg-danger-500",
};

const valueToneClasses: Record<MetricCardTone, string> = {
  neutral: "text-content-primary",
  info: "text-primary-100",
  success: "text-success-100",
  warning: "text-warning-100",
  danger: "text-danger-100",
};

export function MetricCard({
  label,
  value,
  description,
  tone = "neutral",
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-bg-raised",
        "before:absolute before:inset-x-0 before:top-0 before:h-2",
        accentClasses[tone],
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <p className="text-sm font-medium text-content-secondary">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight", valueToneClasses[tone])}>{value}</p>
      {description ? <p className="mt-2 text-sm text-content-tertiary">{description}</p> : null}
    </Card>
  );
}
