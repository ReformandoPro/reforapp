import Link from "next/link";

import { cn } from "./cn";

type LinkButtonVariant = "primary" | "secondary" | "ghost";

type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  variant?: LinkButtonVariant;
  fullWidth?: boolean;
  className?: string;
};

const variantClasses: Record<LinkButtonVariant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",
  secondary: "border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised",
  ghost: "bg-transparent text-content-secondary hover:bg-bg-raised hover:text-content-primary",
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
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
}
