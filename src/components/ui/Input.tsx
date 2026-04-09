import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  errorMessage?: string;
};

/**
 * Input — base form input with brand focus ring and error state.
 */
export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "h-9 w-full rounded-md border bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400",
            "transition-colors outline-none",
            "focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/20",
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20"
              : "border-[var(--border)]",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
            className
          )}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-xs text-[var(--danger)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
