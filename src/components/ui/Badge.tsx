import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  /** Current prop name in the app. */
  tone?: BadgeTone;
  /** Modern-system alias (additive). */
  status?: BadgeTone;
  /** Optional leading dot (additive). Default false (no visual change). */
  dot?: boolean;
  /** Optional pill toggle (additive). Default true to keep current rounded-full. */
  pill?: boolean;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--ds-bg-surface-raised,var(--bg-surface-raised))] text-[var(--ds-content-secondary,var(--text-secondary))]",
  success:
    "bg-[var(--ds-success-900,var(--success-900))] text-[var(--ds-success-100,var(--success-100))]",
  warning:
    "bg-[var(--ds-warning-900,var(--warning-900))] text-[var(--ds-warning-100,var(--warning-100))]",
  danger:
    "bg-[var(--ds-danger-900,var(--danger-900))] text-[var(--ds-danger-100,var(--danger-100))]",
  info:
    "bg-[var(--ds-primary-900,var(--primary-900))] text-[var(--ds-primary-100,var(--primary-100))]",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-[var(--ds-content-tertiary,var(--text-tertiary))]",
  success: "bg-[var(--ds-success-500,var(--success-500))]",
  warning: "bg-[var(--ds-warning-500,var(--warning-500))]",
  danger: "bg-[var(--ds-danger-500,var(--danger-500))]",
  info: "bg-[var(--ds-primary-300,var(--primary-300))]",
};

export function Badge({
  children,
  className,
  tone,
  status,
  dot = false,
  pill = true,
  ...props
}: BadgeProps) {
  const resolvedTone: BadgeTone = tone ?? status ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center",
        dot && "gap-1.5",
        pill ? "rounded-full" : "rounded-md",
        "px-3 py-1 text-xs font-medium",
        toneClasses[resolvedTone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-2 w-2 rounded-full", dotClasses[resolvedTone])} />}
      {children}
    </span>
  );
}
