import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full rounded-[10px] border border-border bg-surface-card px-3 py-2 text-sm outline-none focus:border-brand-primary",
        className,
      )}
      {...props}
    />
  );
}
