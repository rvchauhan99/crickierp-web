"use client";

import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/Button";
import { NotificationItem } from "@/components/layout/NotificationItem";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NotificationPanel({ open, onClose }: Props) {
  const { items, markOneRead, markAllRead } = useNotifications();
  const todayBoundary = new Date();
  todayBoundary.setHours(0, 0, 0, 0);
  const todayItems = items.filter((item) => new Date(item.createdAt).getTime() >= todayBoundary.getTime());
  const earlierItems = items.filter((item) => new Date(item.createdAt).getTime() < todayBoundary.getTime());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close notifications"
        className="fade-in absolute inset-0 bg-slate-900/10"
        onClick={onClose}
      />
      <div className="slide-in-right absolute inset-y-0 right-0 w-full max-w-sm border-l border-border bg-surface-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Notifications</h3>
          <button className="text-sm text-text-secondary hover:text-foreground" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <Button variant="secondary" onClick={markAllRead}>
            Mark all read
          </Button>
          <Link href="/notifications" className="text-sm text-brand-primary hover:underline" onClick={onClose}>
            Open full page
          </Link>
        </div>
        <div className="scrollbar-thin max-h-[80vh] space-y-2 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="rounded-lg border border-border p-3 text-sm text-text-secondary">No notifications.</p>
          ) : (
            <>
              {todayItems.length ? <p className="text-xs font-semibold uppercase text-text-secondary">Today</p> : null}
              {todayItems.map((item) => (
                <NotificationItem key={item.id} item={item} onMarkRead={markOneRead} />
              ))}
              {earlierItems.length ? <p className="pt-2 text-xs font-semibold uppercase text-text-secondary">Earlier</p> : null}
              {earlierItems.map((item) => (
                <NotificationItem key={item.id} item={item} onMarkRead={markOneRead} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
