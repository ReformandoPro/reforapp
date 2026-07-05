import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type CardShadow = "none" | "sm";

type CardVariant = "surface" | "raised" | "active" | "dashed" | "hero";

type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  shadow?: CardShadow;
  variant?: CardVariant;
  padding?: CardPadding;
  as?: ElementType;
};

const shadowClasses: Record<CardShadow, string> = {
  none: "shadow-none",
  sm: "shadow-[var(--shadow-sm)]",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-7",
  xl: "p-7 sm:p-9",
};

const variantClasses: Record<CardVariant, string> = {
  surface:
    "border border-white/[0.06] bg-bg-surface/88 text-content-primary shadow-[var(--shadow-sm)] backdrop-blur",
  raised:
    "border border-white/[0.08] bg-bg-raised/82 text-content-primary shadow-[var(--shadow-sm)] backdrop-blur",
  active: "border border-primary-300/30 bg-primary-500 text-white shadow-primary",
  dashed:
    "border border-dashed border-white/[0.14] bg-white/[0.025] text-content-primary",
  hero:
    "border border-white/[0.08] bg-[linear-gradient(135deg,rgba(14,22,38,0.96),rgba(22,33,50,0.78))] text-content-primary shadow-[var(--shadow-sm)] backdrop-blur",
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
