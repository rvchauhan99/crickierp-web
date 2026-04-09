"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { Input } from "@/components/ui/Input";
import { AppNavNode } from "@/types/navigation";
import { cn } from "@/lib/cn";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { useNotifications } from "@/context/NotificationContext";

function getNodeGlyph(node: AppNavNode): string {
  const source = (node.label || node.id || "x").trim();
  return source.slice(0, 2).toUpperCase();
}

function getDepthPadding(depth: number): string {
  return `${12 + depth * 12}px`;
}

function nodeMatches(node: AppNavNode, query: string): boolean {
  const q = query.toLowerCase();
  const selfMatch =
    node.label.toLowerCase().includes(q) || (node.keywords ?? []).some((key) => key.toLowerCase().includes(q));
  if (selfMatch) return true;
  return (node.children ?? []).some((child) => nodeMatches(child, query));
}

function nodeHasPath(node: AppNavNode, pathname: string): boolean {
  if (node.href === pathname) return true;
  return (node.children ?? []).some((child) => nodeHasPath(child, pathname));
}

function getFirstHref(node: AppNavNode): string {
  if (node.href) return node.href;
  if (node.children?.length) return getFirstHref(node.children[0]);
  return "#";
}

function TreeNode({
  node,
  pathname,
  collapsed,
  onNavigate,
  depth = 0,
}: {
  node: AppNavNode;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  depth?: number;
}) {
  const hasActiveChild = (node.children ?? []).some((child) => nodeHasPath(child, pathname));
  const [open, setOpen] = useState(depth === 0 || hasActiveChild);
  const isActive = nodeHasPath(node, pathname);

  if (node.children?.length) {
    if (collapsed) {
      return (
        <Link
          href={getFirstHref(node)}
          className={cn(
            "block rounded-md border-l-4 px-1.5 py-1.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "border-brand-accent bg-sidebar-active font-semibold text-brand-primary"
              : "border-transparent hover:bg-sidebar-hover",
          )}
          title={node.label}
          onClick={onNavigate}
        >
          <span className="flex min-w-0 items-center justify-center gap-2">
            <span
              className={cn(
                "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[9px] font-semibold",
                isActive ? "bg-brand-primary/15 text-brand-primary" : "bg-white text-text-secondary",
              )}
            >
              {getNodeGlyph(node)}
            </span>
            <span className="sr-only">{node.label}</span>
          </span>
        </Link>
      );
    }

    return (
      <div className="space-y-1">
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-md border-l-4 px-3 py-1.5 text-left text-sm font-medium transition-all duration-200",
            isActive
              ? "border-brand-accent bg-sidebar-active text-brand-primary"
              : "border-transparent hover:bg-sidebar-hover",
            collapsed && "justify-center px-1.5",
          )}
          style={collapsed ? undefined : { paddingLeft: getDepthPadding(depth) }}
          onClick={() => setOpen((prev) => !prev)}
          title={collapsed ? node.label : undefined}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[9px] font-semibold",
                isActive ? "bg-brand-primary/15 text-brand-primary" : "bg-white text-text-secondary",
              )}
            >
              {getNodeGlyph(node)}
            </span>
            <span className={cn("truncate", collapsed && "sr-only")}>{node.label}</span>
          </span>
          {!collapsed ? (
            <span className="relative h-4 w-4 shrink-0">
              <span
                className={cn(
                  "absolute inset-0 text-xs transition-all duration-200",
                  open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
                )}
              >
                ▾
              </span>
              <span
                className={cn(
                  "absolute inset-0 text-xs transition-all duration-200",
                  open ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
                )}
              >
                ▸
              </span>
            </span>
          ) : null}
        </button>
        <div
          className={cn(
            "ml-[19px] overflow-hidden border-l border-border/80 pl-2 transition-all duration-300 ease-in-out",
            open && !collapsed ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          {open && !collapsed ? (
            <div className="space-y-1">
              {node.children.map((child, index) => (
                <div
                  key={child.id}
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                  )}
                  style={{ transitionDelay: open ? `${index * 25}ms` : "0ms" }}
                >
                  <TreeNode
                    node={child}
                    pathname={pathname}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={node.href ?? "#"}
      className={cn(
        "block rounded-md border-l-4 px-3 py-1.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "border-brand-accent bg-sidebar-active font-semibold text-brand-primary"
          : "border-transparent hover:bg-sidebar-hover",
        collapsed && "px-1.5",
      )}
      style={collapsed ? undefined : { paddingLeft: getDepthPadding(depth) }}
      title={collapsed ? node.label : undefined}
      onClick={onNavigate}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[9px] font-semibold",
            isActive ? "bg-brand-primary/15 text-brand-primary" : "bg-white text-text-secondary",
          )}
        >
          {getNodeGlyph(node)}
        </span>
        <span className={cn("truncate", collapsed && "sr-only")}>{node.label}</span>
      </span>
    </Link>
  );
}

type Props = {
  open: boolean;
  collapsed?: boolean;
  isFullscreen?: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onToggleFullscreen: () => void;
  onOpenNotifications: () => void;
};

export function SidebarTree({
  open,
  collapsed = false,
  isFullscreen = false,
  onClose,
  onToggleCollapse,
  onToggleFullscreen,
  onOpenNotifications,
}: Props) {
  const pathname = usePathname();
  const [menuSearch, setMenuSearch] = useState("");
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const filteredNodes = useMemo(() => {
    if (!menuSearch.trim()) return NAV_ITEMS;
    return NAV_ITEMS.filter((node) => nodeMatches(node, menuSearch));
  }, [menuSearch]);

  const visibleNodes = collapsed ? NAV_ITEMS : filteredNodes;

  const navContent = (
    <>
      <div className="mb-4">
        <p className="text-lg font-bold text-brand-primary">{collapsed ? "CE" : "crickierp"}</p>
        {!collapsed ? <p className="text-xs text-text-secondary">Client Admin Panel</p> : null}
      </div>
      {!collapsed ? <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">General</p> : null}

      {!collapsed ? (
        <Input
          placeholder="Search menus..."
          value={menuSearch}
          onChange={(event) => setMenuSearch(event.target.value)}
          className="mb-3 bg-white"
        />
      ) : null}

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto pr-1">
        {visibleNodes.length === 0 ? (
          <p className="rounded-lg border border-border bg-white p-3 text-sm text-text-secondary">
            No menu result found.
          </p>
        ) : (
          visibleNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onClose}
            />
          ))
        )}
      </div>

      <div className="mt-3 space-y-2 border-t border-border pt-3">
        <button
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface-card px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-hover"
          onClick={() => {
            onOpenNotifications();
            onClose();
          }}
          title={collapsed ? "Notifications" : undefined}
        >
          <span className={cn(collapsed && "mx-auto")}>{collapsed ? "NT" : "Notifications"}</span>
          {!collapsed && unreadCount > 0 ? (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
        <button
          className="w-full rounded-lg border border-border bg-surface-card px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-hover"
          onClick={onToggleFullscreen}
          title={collapsed ? (isFullscreen ? "Exit Fullscreen" : "Fullscreen") : undefined}
        >
          {collapsed ? "FS" : isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <button
          className="hidden w-full rounded-lg border border-border bg-surface-card px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-hover md:block"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar" : undefined}
        >
          {collapsed ? "EXP" : "Collapse Sidebar"}
        </button>
        {!collapsed ? <ProfileMenu /> : <div className="rounded-lg border border-border bg-surface-card px-3 py-2 text-center text-xs font-semibold">PR</div>}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "app-sidebar hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar-bg px-3 py-4 transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-80",
        )}
      >
        {navContent}
      </aside>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/25 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-border bg-sidebar-bg px-3 py-4 transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-2 flex justify-end">
          <button className="rounded-md border border-border px-2 py-1 text-xs" onClick={onClose}>
            Close
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );
}
