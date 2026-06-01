import type { HTMLAttributes } from "react";

type MetricCardTone = "neutral" | "info" | "success" | "warning" | "danger";

type MetricCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string | number;
  description?: string;
  tone?: MetricCardTone;
};

const toneClasses: Record<MetricCardTone, string> = {
  neutral:
    "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
  info:
    "border-[var(--primary-500)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
  success:
    "border-[var(--success-500)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
  warning:
    "border-[var(--warning-500)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
  danger:
    "border-[var(--danger-500)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
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
  className = "",
  ...props
}: MetricCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 shadow-none",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <p className={["mt-3 text-3xl font-semibold tracking-tight", valueToneClasses[tone]].join(" ")}>
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">{description}</p>
      ) : null}
    </div>
  );
}
