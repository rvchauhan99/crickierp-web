"use client";

import { cn } from "@/lib/cn";
import { IconSearch, IconCalendar, IconX } from "@tabler/icons-react";

type FilterItem =
  | { key: string; label: string; type: "search" }
  | { key: string; label: string; type: "text" }
  | { key: string; label: string; type: "date" }
  | { key: string; label: string; type: "datetime" }
  | { key: string; label: string; type: "select"; options: Array<{ label: string; value: string }> }
  | { key: string; label: string; type: "number" };

type Props = {
  config: FilterItem[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear?: () => void;
  className?: string;
};

const FILTER_ALL = "__all__";

/**
 * FilterToolbar — config-driven horizontal filter bar with search, date, select, text filters.
 * Matches solar-web FilterBar pattern.
 */
export function FilterToolbar({ config, values, onChange, onClear, className }: Props) {
  const hasAnyValue = Object.values(values).some(
    (v) => v != null && String(v).trim() !== ""
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {config.map((item) => {
        const value = values[item.key] ?? "";

        if (item.type === "search") {
          return (
            <div key={item.key} className="relative min-w-[200px] flex-1">
              <IconSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder={item.label}
                className="h-9 w-full rounded-md border border-[var(--border)] bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/20"
                value={value}
                onChange={(e) => onChange(item.key, e.target.value)}
              />
            </div>
          );
        }

        if (item.type === "date" || item.type === "datetime") {
          return (
            <div key={item.key} className="relative min-w-[160px] max-w-[200px]">
              <IconCalendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type={item.type === "datetime" ? "datetime-local" : "date"}
                placeholder={item.label}
                className="h-9 w-full rounded-md border border-[var(--border)] bg-white py-1.5 pl-9 pr-3 text-sm text-gray-700 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/20"
                value={value}
                onChange={(e) => onChange(item.key, e.target.value)}
              />
            </div>
          );
        }

        if (item.type === "select" && "options" in item) {
          return (
            <div key={item.key} className="min-w-[160px] max-w-[220px]">
              <select
                className="h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-700 focus:border-[var(--brand-primary)] focus:outline-none"
                value={value === "" || value == null ? FILTER_ALL : value}
                onChange={(e) =>
                  onChange(item.key, e.target.value === FILTER_ALL ? "" : e.target.value)
                }
              >
                <option value={FILTER_ALL}>{item.label} — All</option>
                {item.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // text / number
        return (
          <div key={item.key} className="min-w-[140px] max-w-[200px]">
            <input
              type={item.type === "number" ? "number" : "text"}
              placeholder={item.label}
              className="h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/20"
              value={value}
              onChange={(e) => onChange(item.key, e.target.value)}
            />
          </div>
        );
      })}

      {onClear && hasAnyValue && (
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          onClick={onClear}
        >
          <IconX className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </div>
  );
}

// Backward compat: keep old FilterToolbar signature working as well
export type { FilterItem as FilterConfig };
