"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

type Props = {
  page: number;          // 0-based
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

const DEFAULT_OPTIONS = [10, 20, 50, 100, 200];

export function PaginationControls({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_OPTIONS,
  className = "",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const effectiveOptions = Array.from(
    new Set([pageSize, ...pageSizeOptions])
  ).sort((a, b) => a - b);

  return (
    <div
      className={[
        "flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      ].join(" ")}
    >
      {/* Left: entry count */}
      <div className="text-xs text-gray-500 sm:text-sm">
        Showing{" "}
        <span className="font-semibold text-gray-700">{from}</span>{" "}
        to{" "}
        <span className="font-semibold text-gray-700">{to}</span>{" "}
        of{" "}
        <span className="font-semibold text-gray-700">{total}</span>{" "}
        entries
      </div>

      {/* Right: navigation + per page */}
      <div className="flex flex-row items-center gap-2">
        {/* Previous */}
        <button
          className="flex h-8 items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="Previous page"
        >
          <IconChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        {/* Page indicator */}
        <span className="whitespace-nowrap text-xs text-gray-500 sm:text-sm">
          Page{" "}
          <span className="font-semibold text-gray-700">{page + 1}</span>{" "}
          of{" "}
          <span className="font-semibold text-gray-700">{totalPages}</span>
        </span>

        {/* Next */}
        <button
          className="flex h-8 items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={(page + 1) >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <IconChevronRight className="h-4 w-4" />
        </button>

        {/* Per page */}
        {onPageSizeChange && (
          <select
            className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs text-gray-700 transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10 sm:w-[120px]"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {effectiveOptions.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
