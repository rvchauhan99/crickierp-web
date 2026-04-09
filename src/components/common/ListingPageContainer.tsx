import { PropsWithChildren, ReactNode } from "react";
import { IconPlus, IconDownload, IconUpload } from "@tabler/icons-react";
import { cn } from "@/lib/cn";

type Props = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  footer?: ReactNode;
  density?: "comfortable" | "compact";
  fullWidth?: boolean;
  // Convenience action props (alternative to passing full actions node)
  addButtonLabel?: string;
  onAddClick?: () => void;
  exportButtonLabel?: string;
  onExportClick?: () => void;
  exportDisabled?: boolean;
  importButtonLabel?: string;
  onImportClick?: () => void;
  secondaryButtonLabel?: string;
  onSecondaryClick?: () => void;
}>;

export function ListingPageContainer({
  title,
  description,
  actions,
  filters,
  footer,
  density = "comfortable",
  fullWidth = false,
  addButtonLabel,
  onAddClick,
  exportButtonLabel,
  onExportClick,
  exportDisabled = false,
  importButtonLabel,
  onImportClick,
  secondaryButtonLabel,
  onSecondaryClick,
  children,
}: Props) {
  const gap = density === "compact" ? "gap-2" : "gap-3";

  // Build action buttons if convenience props are provided
  const builtActions = !actions ? (
    <div className="flex items-center gap-1.5 flex-wrap">
      {onSecondaryClick && secondaryButtonLabel && (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onSecondaryClick}
        >
          {secondaryButtonLabel}
        </button>
      )}
      {onExportClick && exportButtonLabel && (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onExportClick}
          disabled={exportDisabled}
        >
          <IconDownload className="h-4 w-4" />
          {exportButtonLabel}
        </button>
      )}
      {onImportClick && importButtonLabel && (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onImportClick}
        >
          <IconUpload className="h-4 w-4" />
          {importButtonLabel}
        </button>
      )}
      {onAddClick && addButtonLabel && (
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md bg-[var(--brand-primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-primary-hover)]"
          onClick={onAddClick}
        >
          <IconPlus className="h-4 w-4" />
          {addButtonLabel}
        </button>
      )}
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0",
        gap,
        !fullWidth && "mx-auto max-w-[1536px]"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#1b365d]">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions ?? builtActions}
      </div>

      {/* Filters */}
      {filters && (
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-white p-3">
          {filters}
        </div>
      )}

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="shrink-0 flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );
}
