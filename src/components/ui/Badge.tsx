import { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";

type Props = PropsWithChildren<{
  variant?: BadgeVariant;
  className?: string;
}>;

const variants: Record<BadgeVariant, string> = {
  default: "bg-sidebar-active text-brand-primary",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
};

export function Badge({ variant = "default", className, children }: Props) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
