import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        "w-full rounded-[10px] border border-border bg-surface-card px-3 py-2 text-sm outline-none focus:border-brand-primary",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
