import type { ReactNode } from "react";

import { Card } from "./Card";
import { cn } from "./cn";

type CardActionRowProps = {
  heading: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CardActionRow({
  heading,
  description,
  eyebrow,
  meta,
  leading,
  trailing,
  actions,
  children,
  className,
  contentClassName,
}: CardActionRowProps) {
  return (
    <Card className={cn("p-0 shadow-none", className)}>
      <div className={cn("p-5", contentClassName)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {leading ? <div className="mb-2">{leading}</div> : null}

            {eyebrow ? (
              <div className="text-xs font-medium text-content-secondary">{eyebrow}</div>
            ) : null}

            <div className="text-base font-semibold tracking-tight text-content-primary">
              {heading}
            </div>

            {description ? (
              <div className="mt-1 text-sm text-content-secondary">{description}</div>
            ) : null}

            {meta ? <div className="mt-2 text-xs text-content-tertiary">{meta}</div> : null}

            {children ? <div className="mt-3">{children}</div> : null}
          </div>

          {trailing || actions ? (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end">
              {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
