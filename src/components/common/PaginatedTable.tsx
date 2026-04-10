"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import {
  IconArrowUp,
  IconArrowDown,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";

// ─────────── Types ───────────

export type TableColumn<T = Record<string, unknown>> = {
  key: string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  stickyLeft?: boolean;
  stickyRight?: boolean;
  filterType?: "text" | "select" | "date" | "number";
  filterOptions?: Array<{ label: string; value: string }>;
  filterKey?: string;
  align?: "left" | "center" | "right";
};

type SortOrder = "asc" | "desc";

type Props<T = Record<string, unknown>> = {
  columns: TableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  // Sorting
  sortBy?: string | null;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  // Pagination
  page?: number;          // 0-based
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  // Search
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // Column filters
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  // Row interaction
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T, index: number) => string | number;
  // Layout
  height?: string;
  compactDensity?: boolean;
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// ─────────── SearchInput ───────────

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <IconSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        className="h-9 w-full rounded-md border border-[var(--border)] bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ─────────── Pagination ───────────

function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = ROWS_PER_PAGE_OPTIONS,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const effectiveOptions = Array.from(
    new Set([pageSize, ...pageSizeOptions])
  ).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between bg-[var(--muted)]/30 rounded-b-lg border-t border-[var(--border)]">
      <div className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}</span> to{" "}
        <span className="font-medium text-gray-700">{to}</span> of{" "}
        <span className="font-medium text-gray-700">{total}</span> entries
      </div>
      <div className="flex flex-row items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            aria-label="Previous page"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="whitespace-nowrap text-xs text-gray-500">
            Page <span className="font-medium text-gray-700">{page + 1}</span> of{" "}
            <span className="font-medium text-gray-700">{totalPages}</span>
          </span>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onPageChange(page + 1)}
            disabled={(page + 1) >= totalPages}
            aria-label="Next page"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
        <select
          className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-xs transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {effectiveOptions.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─────────── PaginatedTable ───────────

export function PaginatedTable<T = Record<string, unknown>>({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = "No records found.",
  sortBy = null,
  sortOrder = "desc",
  onSort,
  page = 0,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValues = {},
  onFilterChange,
  onRowClick,
  getRowKey = (_, i) => i,
  height,
  compactDensity = false,
}: Props<T>) {
  const hasFilters = Boolean(onFilterChange);
  const hasPagination = Boolean(onPageChange && total !== undefined);
  const totalRows = total ?? rows.length;
  const cellPy = compactDensity ? "py-1" : "py-2.5";

  const handleSortClick = (key: string) => {
    if (!onSort) return;
    if (sortBy === key) {
      if (sortOrder === "asc") onSort(key, "desc");
      else onSort(key, "asc");
    } else {
      onSort(key, "desc");
    }
  };

  return (
    <div
      className="flex flex-col w-full max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm"
      style={height ? { height } : undefined}
    >
      {/* Search */}
      {showSearch && onSearchChange && (
        <div className="shrink-0 border-b border-[var(--border)] p-2">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {/* Table scroll area */}
      <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-300">
        <table
          className={cn("w-full border-separate border-spacing-0", compactDensity ? "min-w-full" : "min-w-max")}
          aria-label="data table"
        >
          {/* Header */}
          <thead>
            <tr className="bg-[#1b365d] text-white">
              {columns.map((col, colIndex) => {
                const isSortable = col.sortable === true && !!onSort;
                const isActive = sortBy === col.key;
                const isLast = colIndex === columns.length - 1;
                return (
                  <th
                    key={col.key}
                    onClick={isSortable ? () => handleSortClick(col.key) : undefined}
                    className={cn(
                      "sticky top-0 bg-[#1b365d] [background-clip:padding-box] text-left font-semibold uppercase tracking-wide border-b border-[#1b365d] whitespace-nowrap select-none",
                      compactDensity ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs",
                      !isLast && "border-r border-white/20",
                      isSortable && "cursor-pointer hover:bg-[#142847]",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      maxWidth: col.maxWidth,
                    }}
                  >
                    <div className={cn("flex items-center gap-1", col.align === "center" && "justify-center", col.align === "right" && "justify-end")}>
                      <span>{col.label}</span>
                      {isSortable && (
                        <span className="inline-flex flex-col -my-0.5">
                          <IconArrowUp className={cn("size-3", isActive && sortOrder === "asc" ? "opacity-100" : "opacity-35")} />
                          <IconArrowDown className={cn("size-3 -mt-0.5", isActive && sortOrder === "desc" ? "opacity-100" : "opacity-35")} />
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Column filter row */}
            {hasFilters && (
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                {columns.map((col) => {
                  const filterKey = col.filterKey ?? col.key;
                  const value = filterValues[filterKey] ?? "";
                  return (
                    <td key={col.key + "-filter"} className="px-1.5 py-1 align-middle">
                      {col.filterType === "text" && (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            className="h-7 w-full min-w-0 rounded border border-[var(--border)] bg-white px-2 text-xs transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10"
                            value={value}
                            onChange={(e) => onFilterChange?.(filterKey, e.target.value)}
                            placeholder=""
                          />
                          <IconFilter className="size-3 shrink-0 text-gray-400" />
                        </div>
                      )}
                      {col.filterType === "select" && (
                        <select
                          className="h-7 w-full min-w-0 rounded border border-[var(--border)] bg-white px-1.5 text-xs transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10"
                          value={value || "__all__"}
                          onChange={(e) => {
                            const v = e.target.value === "__all__" ? "" : e.target.value;
                            onFilterChange?.(filterKey, v);
                          }}
                        >
                          <option value="__all__">All</option>
                          {(col.filterOptions ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                      {col.filterType === "date" && (
                        <input
                          type="date"
                          className="h-7 w-full min-w-0 rounded border border-[var(--border)] bg-white px-2 text-xs transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10"
                          value={value}
                          onChange={(e) => onFilterChange?.(filterKey, e.target.value)}
                        />
                      )}
                      {col.filterType === "number" && (
                        <input
                          type="number"
                          className="h-7 w-full min-w-0 rounded border border-[var(--border)] bg-white px-2 text-xs transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/10"
                          value={value}
                          onChange={(e) => onFilterChange?.(filterKey, e.target.value)}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </thead>

          {/* Body */}
          <tbody className="relative z-0">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  onClick={
                    onRowClick
                      ? (e) => {
                          if ((e.target as Element).closest?.("button, [role='button'], a")) return;
                          onRowClick(row);
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-[var(--border)] last:border-b-0 transition-colors",
                    "hover:bg-blue-50/60",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 text-sm text-gray-700",
                        cellPy,
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right"
                      )}
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {hasPagination && onPageChange && onPageSizeChange && (
        <div className="shrink-0">
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={totalRows}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
        </div>
      )}
    </div>
  );
}
