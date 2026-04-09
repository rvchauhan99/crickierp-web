import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FormActionsProps = {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
};

/**
 * FormActions — sticky bottom row for form submit/cancel buttons.
 * Use inside FormContainer to get automatic sticky positioning.
 */
export function FormActions({ children, className, align = "right" }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-[var(--border)] bg-white px-5 py-3",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
        align === "left" && "justify-start",
        className
      )}
    >
      {children}
    </div>
  );
}

FormActions.displayName = "FormActions";
