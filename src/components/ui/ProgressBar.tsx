import type { HTMLAttributes } from "react";

type ProgressBarTone = "neutral" | "info" | "success" | "warning" | "danger";

type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  label?: string;
  helperText?: string;
  showValue?: boolean;
  tone?: ProgressBarTone;
};

const trackClasses: Record<ProgressBarTone, string> = {
  neutral: "bg-bg-raised border-subtle",
  info: "bg-bg-raised border-subtle",
  success: "bg-bg-raised border-subtle",
  warning: "bg-bg-raised border-subtle",
  danger: "bg-bg-raised border-subtle",
};

const fillClasses: Record<ProgressBarTone, string> = {
  neutral: "bg-content-secondary",
  info: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
};

export function ProgressBar({
  value,
  label,
  helperText,
  showValue = false,
  tone = "neutral",
  className = "",
  ...props
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={["w-full", className].filter(Boolean).join(" ")} {...props}>
      {label || showValue ? (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label ? <p className="text-xs font-medium text-content-secondary">{label}</p> : <span />}
          {showValue ? <p className="text-xs font-medium text-content-tertiary">{clampedValue}%</p> : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        aria-label={label ?? "Progress"}
        className={[
          "h-2 overflow-hidden rounded-full border",
          trackClasses[tone],
        ].join(" ")}
      >
        <div
          className={["h-full rounded-full transition-[width] duration-200", fillClasses[tone]].join(" ")}
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {helperText ? <p className="mt-2 text-xs text-content-tertiary">{helperText}</p> : null}
    </div>
  );
}
