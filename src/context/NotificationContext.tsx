"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchNotifications } from "@/services/notificationService";
import { NotificationItem } from "@/types/notification";

type NotificationContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  markOneRead: (id: string) => void;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const data = await fetchNotifications();
      if (active) setItems(data);
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const value = useMemo<NotificationContextValue>(() => {
    const unreadCount = items.filter((item) => !item.isRead).length;
    return {
      items,
      unreadCount,
      markOneRead: (id: string) =>
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))),
      markAllRead: () => setItems((prev) => prev.map((item) => ({ ...item, isRead: true }))),
    };
  }, [items]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("useNotifications must be used inside NotificationProvider");
  return value;
}
