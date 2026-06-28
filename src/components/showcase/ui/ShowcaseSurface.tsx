import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type ShowcaseSurfaceProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function ShowcaseSurface({
  children,
  className,
  id,
}: ShowcaseSurfaceProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[16px] border border-[var(--b-subtle)] bg-[var(--bg-surface)] p-4",
        className
      )}
    >
      {children}
    </section>
  );
}

