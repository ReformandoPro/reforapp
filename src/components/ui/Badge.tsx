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
  neutral: "bg-bg-raised text-content-secondary border border-subtle",
  success: "bg-success-900 text-success-100",
  warning: "bg-warning-900 text-warning-100",
  danger: "bg-danger-900 text-danger-100",
  info: "bg-primary-900 text-primary-100",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-content-tertiary",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-primary-300",
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
