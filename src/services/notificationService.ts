import { NotificationItem } from "@/types/notification";

const now = Date.now();

const mockNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Exchange Created",
    description: "E2E exchange was created successfully.",
    createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
    isRead: false,
    link: "/exchange/list",
  },
  {
    id: "n-2",
    title: "Deposit Updated",
    description: "A banker deposit was updated by admin.",
    createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
    isRead: false,
    link: "/deposit/banker",
  },
  {
    id: "n-3",
    title: "Report Exported",
    description: "Transaction report export completed.",
    createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    isRead: true,
    link: "/reports/transaction-history",
  },
];

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return Promise.resolve(mockNotifications);
}
