"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
  onClose: () => void;
};

export function Drawer({ open, title, side = "right", children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const sideClass = side === "right" ? "right-0 border-l" : "left-0 border-r";
  return (
    <div className="fixed inset-0 z-50 bg-black/20" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-y-0 ${sideClass} w-full max-w-md border-border bg-surface-card p-4 shadow-xl`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" className="text-sm text-text-secondary hover:text-foreground" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
