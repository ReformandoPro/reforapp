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
  neutral: "border-[var(--border-subtle)]",
  info: "border-[var(--primary-500)]",
  success: "border-[var(--success-500)]",
  warning: "border-[var(--warning-500)]",
  danger: "border-[var(--danger-500)]",
};

const valueToneClasses: Record<MetricCardTone, string> = {
  neutral: "text-[var(--text-primary)]",
  info: "text-[var(--primary-100)]",
  success: "text-[var(--success-100)]",
  warning: "text-[var(--warning-100)]",
  danger: "text-[var(--danger-100)]",
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
        "bg-[var(--bg-surface-raised)]",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight",
          valueToneClasses[tone]
        )}
      >
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">{description}</p>
      ) : null}
    </Card>
  );
}
