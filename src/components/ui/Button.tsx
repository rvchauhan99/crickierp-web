import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-sm",
  secondary:
    "bg-white text-gray-700 border border-[var(--border)] hover:bg-gray-50 shadow-sm",
  outline:
    "bg-transparent text-gray-700 border border-[var(--border)] hover:bg-gray-50",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100",
  danger:
    "bg-[var(--danger)] text-white hover:opacity-90 shadow-sm",
  success:
    "bg-[var(--brand-accent)] text-white hover:opacity-90 shadow-sm",
};

const sizes: Record<Size, string> = {
  xs:   "h-6 px-2 text-xs rounded-md gap-1",
  sm:   "h-8 px-3 text-sm rounded-md gap-1.5",
  md:   "h-9 px-4 text-sm rounded-lg gap-2",
  lg:   "h-10 px-5 text-sm rounded-lg gap-2 font-medium",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-1",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : leftIcon}
      {size !== "icon" && children}
      {!loading && size !== "icon" && rightIcon}
    </button>
  );
}
