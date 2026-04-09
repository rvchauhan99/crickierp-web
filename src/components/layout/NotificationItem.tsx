"use client";

import Link from "next/link";
import { NotificationItem as NotificationItemType } from "@/types/notification";
import { NotificationMarkReadAction } from "@/modules/notification/components/NotificationMarkReadAction";

type Props = {
  item: NotificationItemType;
  onMarkRead: (id: string) => void;
};

export function NotificationItem({ item, onMarkRead }: Props) {
  return (
    <div className="fade-in rounded-lg border border-border p-3 transition-colors hover:bg-sidebar-hover/30">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{item.title}</p>
        {!item.isRead ? <span className="h-2 w-2 rounded-full bg-brand-primary" /> : null}
      </div>
      <p className="mb-2 text-xs text-text-secondary">{item.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-secondary">{new Date(item.createdAt).toLocaleString()}</span>
        <div className="flex items-center gap-2">
          {item.link ? (
            <Link href={item.link} className="text-xs text-brand-primary hover:underline">
              Open
            </Link>
          ) : null}
          <NotificationMarkReadAction isRead={item.isRead} onMarkRead={() => onMarkRead(item.id)} />
        </div>
      </div>
    </div>
  );
}
