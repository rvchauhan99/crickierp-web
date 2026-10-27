import {
  Children,
  cloneElement,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/cn";

// ─────────── FormActions ───────────

type FormActionsProps = {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  /**
   * CR/operator mode (default true): Clear/Reset/Cancel (non-primary, non-success)
   * stay out of Tab order so Tab from the last field lands on Save.
   */
  operatorMode?: boolean;
};

const PRIMARY_TAB_VARIANTS = new Set(["primary", "success"]);

function withOperatorTabOrder(children: ReactNode, operatorMode: boolean): ReactNode {
  if (!operatorMode) return children;
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const props = child.props as {
      variant?: string | null;
      tabIndex?: number;
      skipTab?: boolean;
    };
    // Caller already set tab order — respect it.
    if (props.tabIndex != null || props.skipTab != null) return child;
    const variant = props.variant ?? "primary";
    if (PRIMARY_TAB_VARIANTS.has(String(variant))) return child;
    return cloneElement(child as ReactElement<{ tabIndex?: number }>, { tabIndex: -1 });
  });
}

/**
 * Footer action row for forms. Use as a direct child of `FormContainer` so it stays
 * below the scrollable body (sticky card footer). Default padding matches form content (`px-5`).
 */
export function FormActions({
  children,
  className,
  align = "right",
  operatorMode = true,
}: FormActionsProps) {
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
      {withOperatorTabOrder(children, operatorMode)}
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
  contentOverflow?: "auto" | "visible";
  className?: string;
  /** Continuous-entry root for operator focus after save. */
  entryRef?: Ref<HTMLDivElement | null>;
}>;

export function FormContainer({
  title,
  description,
  sideContent,
  maxHeight,
  contentOverflow = "auto",
  className,
  entryRef,
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
      ref={entryRef}
      className={cn(
        "flex flex-col min-h-0 flex-1 rounded-lg border border-[var(--border)] bg-white shadow-sm",
        contentOverflow === "auto" ? "overflow-hidden" : "overflow-visible",
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
          "flex-1 min-h-0 px-5 py-4",
          contentOverflow === "auto" ? "overflow-y-auto overflow-x-hidden" : "overflow-visible",
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
