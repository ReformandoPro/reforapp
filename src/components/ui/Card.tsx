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
  surface: "bg-bg-surface border border-subtle text-content-primary",
  raised: "bg-bg-raised border text-content-primary",
  active: "bg-primary-500 border border-primary-500 text-white",
  dashed: "bg-transparent border border-dashed border-strong text-content-primary",
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
        "rounded-lg",
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
