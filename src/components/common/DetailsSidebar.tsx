"use client";

import { PropsWithChildren, useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { IconX } from "@tabler/icons-react";
import { handleOperatorTabTrap, listOperatorTabbables } from "@/lib/operatorFocus";

type Props = PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  width?: string;
  /**
   * When this changes while open (e.g. selected row id), refocus the first
   * tabbable content field. Use for approval drawers that stay open across rows.
   */
  focusKey?: string | number | null;
}>;

/**
 * DetailsSidebar — slide-in panel from the right for record details.
 * Matches solar-web DetailsSidebar pattern.
 * Operator UX: Close is out of Tab order (Escape closes); soft Tab trap + autofocus
 * first content field so approval drawers skip listing chrome.
 */
export function DetailsSidebar({
  open,
  title,
  subtitle,
  onClose,
  width = "420px",
  focusKey = null,
  children,
}: Props) {
  const panelRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (panel) handleOperatorTabTrap(event, panel);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return false;
      const content = contentRef.current;
      if (!content) return false;
      const tabbables = listOperatorTabbables(content);
      const first = tabbables[0];
      if (!first) return false;
      try {
        first.focus({ preventScroll: false });
        return document.activeElement === first;
      } catch {
        return false;
      }
    };
    // Sync after paint; short retries for Autocomplete mount (rAF pauses in background tabs).
    if (tryFocus()) {
      return () => {
        cancelled = true;
      };
    }
    const t1 = window.setTimeout(() => {
      if (tryFocus()) return;
      window.setTimeout(() => {
        tryFocus();
      }, 100);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
    };
  }, [open, focusKey]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col border-l border-[var(--border)] bg-white shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#1b365d]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close panel"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-200"
        >
          {children}
        </div>
      </aside>
    </>
  );
}
