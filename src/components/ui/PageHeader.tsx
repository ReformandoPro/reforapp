import { Card } from "./Card";
import { cn } from "./cn";

type PageHeaderProps = {
  backLink?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  backLink,
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {backLink ? <div>{backLink}</div> : null}

      <Card padding="xl" variant="hero">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
            <h1 className="font-num text-3xl font-bold tracking-tight text-content-primary sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-content-secondary sm:text-base">
                {description}
              </p>
            ) : null}
            {meta ? <div className="mt-4">{meta}</div> : null}
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
        </div>
      </Card>
    </div>
  );
}
