import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type CardShadow = "none" | "sm";

type CardVariant = "surface" | "raised" | "active" | "dashed";

type CardPadding = "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  /** Kept for backwards compatibility with current app usage. */
  shadow?: CardShadow;
  /** Optional modern design system surface variants (additive). */
  variant?: CardVariant;
  /** Optional padding scale (additive). Default keeps current p-5. */
  padding?: CardPadding;
  /** Optional element override (additive). Default is div. */
  as?: ElementType;
};

const shadowClasses: Record<CardShadow, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
};

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const variantClasses: Record<CardVariant, string> = {
  // Prefer DS vars, but fall back to existing runtime vars.
  surface:
    "border border-[var(--border-subtle)] bg-[var(--ds-bg-surface,var(--bg-surface))] text-[var(--ds-content-primary,var(--text-primary))]",
  raised:
    "border border-[var(--border-default)] bg-[var(--ds-bg-surface-raised,var(--bg-surface-raised))] text-[var(--ds-content-primary,var(--text-primary))]",
  active:
    "border border-[var(--ds-primary-500,var(--primary-500))] bg-[var(--ds-primary-500,var(--primary-500))] text-white",
  dashed:
    "bg-transparent border border-dashed border-[var(--border-strong)] text-[var(--ds-content-primary,var(--text-primary))]",
};

export function Card({
  children,
  className,
  shadow = "sm",
  variant = "surface",
  padding = "md",
  as: Tag = "div",
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        // Keep current rounding to avoid a visual reset.
        "rounded-2xl",
        paddingClasses[padding],
        variantClasses[variant],
        shadowClasses[shadow],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
