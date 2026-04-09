import { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type Props = PropsWithChildren<{
  title?: string;
  description?: string;
  className?: string;
}>;

/**
 * FormSection — titled section separator within a form.
 * Groups related fields under a heading with optional description.
 */
export function FormSection({ title, description, className, children }: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="border-b border-[var(--border)] pb-2">
          {title && (
            <h3 className="text-sm font-semibold text-[#1b365d]">{title}</h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
