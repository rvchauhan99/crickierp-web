import { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type Props = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  sideContent?: ReactNode;
  stickyActions?: boolean;
}>;

export function FormContainer({
  title,
  description,
  actions,
  sideContent,
  stickyActions = true,
  children,
}: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
        </div>
        {sideContent}
      </div>
      <div>{children}</div>
      {actions ? (
        <div className={stickyActions ? "sticky bottom-0 z-10 -mx-4 border-t border-border bg-surface-card px-4 py-3" : ""}>
          {actions}
        </div>
      ) : null}
    </Card>
  );
}
