"use client";

import { useNotifications } from "@/context/NotificationContext";
import { NotificationBadge } from "@/components/layout/NotificationBadge";

type Props = {
  onClick: () => void;
};

export function NotificationBell({ onClick }: Props) {
  const { unreadCount } = useNotifications();
  const hasUnread = unreadCount > 0;
  return (
    <button
      className={`relative rounded-lg border px-3 py-2 text-sm transition-colors ${
        hasUnread
          ? "border-brand-primary/30 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10"
          : "border-border bg-surface-card hover:bg-sidebar-hover"
      }`}
      onClick={onClick}
      aria-label="Open notifications"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded bg-surface-card px-1.5 py-0.5 text-[10px] font-semibold">ALERT</span>
        <span>Notifications</span>
      </span>
      <NotificationBadge count={unreadCount} />
    </button>
  );
}
