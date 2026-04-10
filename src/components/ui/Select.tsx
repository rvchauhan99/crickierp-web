import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
  errorMessage?: string;
  placeholder?: string;
};

/**
 * Select — native select with brand focus ring, error state, and placeholder option.
 */
export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className, error, errorMessage, placeholder, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={cn(
            "h-9 w-full rounded-md border bg-white px-3 text-sm text-gray-800",
            "transition-all outline-none",
            "focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/10",
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20"
              : "border-[var(--border)]",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {error && errorMessage && (
          <p className="mt-1 text-xs text-[var(--danger)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
