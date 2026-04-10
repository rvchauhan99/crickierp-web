"use client";

import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { IconSearch, IconX } from "@tabler/icons-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
};

/**
 * SearchInput — search field with magnifier icon and optional clear (X) button.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className,
  ...props
}: Props) {
  return (
    <div className={cn("relative w-full", className)}>
      <IconSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-[var(--border)] bg-white py-1.5 pl-9 pr-9 text-sm text-gray-800 placeholder:text-gray-400 transition-all outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {value && (
        <button
          type="button"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => { onChange(""); onClear?.(); }}
          aria-label="Clear search"
          tabIndex={-1}
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
