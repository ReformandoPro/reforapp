import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]",
  success: "bg-[var(--success-900)] text-[var(--success-100)]",
  warning: "bg-[var(--warning-900)] text-[var(--warning-100)]",
  danger: "bg-[var(--danger-900)] text-[var(--danger-100)]",
  info: "bg-[var(--primary-900)] text-[var(--primary-100)]",
};

export function Badge({
  children,
  className = "",
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
