"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export type AutocompleteOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (nextValue: string) => void;
  loadOptions: (query: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
  emptyText?: string;
};

export function AutocompleteField({
  value,
  onChange,
  loadOptions,
  placeholder = "Search...",
  disabled = false,
  debounceMs = 300,
  emptyText = "No records found",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState<AutocompleteOption | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const displayText = open ? query : selectedOption?.label ?? "";

  const runLoad = useCallback(
    async (text: string) => {
      setLoading(true);
      try {
        const rows = await loadOptions(text);
        setOptions(rows);
      } finally {
        setLoading(false);
      }
    },
    [loadOptions]
  );

  useEffect(() => {
    if (!open || disabled) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      runLoad(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open, disabled, debounceMs, runLoad]);

  useEffect(() => {
    const found = options.find((opt) => opt.value === value) ?? selectedOption;
    setSelectedOption(value ? found ?? null : null);
  }, [value, options, selectedOption]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1 >= options.length ? 0 : prev + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
      return;
    }
    if (event.key === "Enter" && open && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      const picked = options[activeIndex];
      setSelectedOption(picked);
      onChange(picked.value);
      setOpen(false);
      setQuery("");
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const showClear = useMemo(() => Boolean(value) && !disabled, [value, disabled]);

  return (
    <div className="relative w-full" ref={rootRef}>
      <div className="relative">
        <Input
          value={displayText}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {showClear && (
          <button
            type="button"
            onClick={() => {
              setSelectedOption(null);
              setQuery("");
              setOptions([]);
              onChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-[var(--border)] bg-white py-1 shadow-md">
          {loading ? (
            <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
          ) : (
            options.map((option, index) => (
              <li
                key={option.value}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm",
                  index === activeIndex ? "bg-[var(--brand-primary)] text-white" : "hover:bg-gray-50"
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setSelectedOption(option);
                  onChange(option.value);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
