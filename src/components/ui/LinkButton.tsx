import Link from "next/link";

import { cn } from "./cn";

type LinkButtonVariant = "primary" | "secondary" | "ghost";

type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  variant?: LinkButtonVariant;
  fullWidth?: boolean;
  className?: string;
};

const variantClasses: Record<LinkButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white shadow-primary hover:bg-primary-600 hover:shadow-[0_10px_30px_rgba(45,127,249,0.42)]",
  secondary:
    "border border-white/[0.10] bg-white/[0.03] text-primary-100 hover:border-primary-300/40 hover:bg-primary-500/10 hover:text-white",
  ghost:
    "bg-transparent text-content-secondary hover:bg-white/[0.04] hover:text-content-primary",
};

export function LinkButton({
  variant = "primary",
  fullWidth = false,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
}
