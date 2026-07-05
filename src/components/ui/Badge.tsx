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
  neutral: "border border-white/[0.08] bg-white/[0.04] text-content-secondary",
  success: "border border-success-500/20 bg-success-500/12 text-success-100",
  warning: "border border-warning-500/20 bg-warning-500/12 text-warning-100",
  danger: "border border-danger-500/20 bg-danger-500/12 text-danger-100",
  info: "border border-primary-300/20 bg-primary-500/12 text-primary-100",
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
        "px-3 py-1 text-xs font-semibold",
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
