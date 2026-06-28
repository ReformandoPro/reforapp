import { cn } from "@/components/ui/cn";

type ShowcaseProgressBarProps = {
  value: number;
  className?: string;
};

export function ShowcaseProgressBar({
  value,
  className,
}: ShowcaseProgressBarProps) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div
      className={cn(
        "h-[10px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]",
        className
      )}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[var(--primary-500)]"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

