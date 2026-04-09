"use client";

import { useMemo, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { FilterToolbar } from "@/components/common/FilterToolbar";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { Button } from "@/components/ui/Button";
import { NotificationItem } from "@/components/layout/NotificationItem";
import { useListingQueryState } from "@/hooks/useListingQueryState";
import { NotificationEmptyState } from "@/modules/notification/components/NotificationEmptyState";

export function NotificationList() {
  const { items, markOneRead, markAllRead } = useNotifications();
  const { state, setState } = useListingQueryState();
  const [search, setSearch] = useState(state.search);
  const [fromDate, setFromDate] = useState(state.fromDate);
  const [toDate, setToDate] = useState(state.toDate);

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
        <FilterToolbar
          search={search}
          fromDate={fromDate}
          toDate={toDate}
          onChange={(next) => {
            if (next.search !== undefined) {
              setSearch(next.search);
              setState({ search: next.search, page: 1 });
            }
            if (next.fromDate !== undefined) {
              setFromDate(next.fromDate);
              setState({ fromDate: next.fromDate, page: 1 });
            }
            if (next.toDate !== undefined) {
              setToDate(next.toDate);
              setState({ toDate: next.toDate, page: 1 });
            }
          }}
          onReset={() => {
            setSearch("");
            setFromDate("");
            setToDate("");
            setState({ search: "", fromDate: "", toDate: "", page: 1 });
          }}
        />
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
