"use client";

import { useMemo, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NotificationItem } from "@/components/layout/NotificationItem";
import { NotificationEmptyState } from "@/modules/notification/components/NotificationEmptyState";

export function NotificationList() {
  const { items, markOneRead, markAllRead } = useNotifications();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }, [items, search]);

  const todayBoundary = new Date();
  todayBoundary.setHours(0, 0, 0, 0);
  const todayItems = rows.filter((item) => new Date(item.createdAt).getTime() >= todayBoundary.getTime());
  const earlierItems = rows.filter((item) => new Date(item.createdAt).getTime() < todayBoundary.getTime());

  return (
    <ListingPageContainer
      title="Notifications"
      description="Track unread and recent platform alerts."
      density="compact"
      actions={
        <Button variant="secondary" onClick={markAllRead}>
          Mark all read
        </Button>
      }
      filters={
        <div className="flex items-center gap-2">
          <Input
            className="max-w-[320px]"
            placeholder="Search by title / description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      }
    >
      <div className="space-y-2">
        {rows.length === 0 ? (
          <NotificationEmptyState />
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
    </ListingPageContainer>
  );
}
