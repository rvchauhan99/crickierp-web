import { Children, isValidElement, PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/cn";

// ─────────── FormActions ───────────

type FormActionsProps = {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
};

export function FormActions({ children, className, align = "right" }: FormActionsProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-[var(--border)] bg-white px-4 py-3 flex gap-2",
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

// ─────────── FormContainer ───────────

type FormContainerProps = PropsWithChildren<{
  title?: string;
  description?: string;
  sideContent?: ReactNode;
  maxHeight?: string;
  className?: string;
}>;

export function FormContainer({
  title,
  description,
  sideContent,
  maxHeight,
  className,
  children,
}: FormContainerProps) {
  const formActions: ReactNode[] = [];
  const otherChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (
        (child.type as { displayName?: string })?.displayName === "FormActions" ||
        (child.type as { name?: string })?.name === "FormActions"
      )
    ) {
      formActions.push(child);
    } else {
      otherChildren.push(child);
    }
  });

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 flex-1 rounded-lg border border-[var(--border)] bg-white shadow-sm overflow-hidden",
        maxHeight && "max-h-[var(--form-max-height)]",
        className
      )}
      style={maxHeight ? { "--form-max-height": maxHeight } as React.CSSProperties : undefined}
    >
      {/* Optional header */}
      {(title || description || sideContent) && (
        <div className="shrink-0 border-b border-[var(--border)] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {title && <h2 className="text-base font-semibold text-[#1b365d]">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
            </div>
            {sideContent}
          </div>
        </div>
      )}

      {/* Scrollable form body */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4",
          "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-200"
        )}
      >
        {otherChildren}
      </div>

      {/* Sticky FormActions at bottom */}
      {formActions.length > 0 && (
        <div className="shrink-0">
          {formActions}
        </div>
      )}
    </div>
  );
}
