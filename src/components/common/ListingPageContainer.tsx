import { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type Props = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  footer?: ReactNode;
  density?: "comfortable" | "compact";
}>;

export function ListingPageContainer({
  title,
  description,
  actions,
  filters,
  footer,
  density = "comfortable",
  children,
}: Props) {
  return (
    <div className={density === "compact" ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-surface-card p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
        </div>
        {actions}
      </div>
      {filters ? <Card className="p-3">{filters}</Card> : null}
      <Card className={density === "compact" ? "p-3" : "p-4"}>{children}</Card>
      {footer ? <div className="flex justify-end">{footer}</div> : null}
    </div>
  );
}
