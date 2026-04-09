"use client";

type Props = {
  onOpenSidebar: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export function Topbar({ onOpenSidebar, isFullscreen, onToggleFullscreen }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-topbar-bg px-3 md:hidden">
      <button
        className="rounded-md border border-border bg-surface-card px-2 py-1 text-xs transition-colors hover:bg-sidebar-hover"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        Menu
      </button>
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-border bg-surface-card px-2 py-1 text-xs transition-colors hover:bg-sidebar-hover"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>
    </header>
  );
}
