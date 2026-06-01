import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type CardShadow = "none" | "sm";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  shadow?: CardShadow;
};

const shadowClasses: Record<CardShadow, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
};

export function Card({
  children,
  className,
  shadow = "sm",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)]",
        shadowClasses[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
