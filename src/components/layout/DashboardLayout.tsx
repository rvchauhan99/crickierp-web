"use client";

import { PropsWithChildren, useState } from "react";
import { SidebarTree } from "@/components/layout/SidebarTree";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { Topbar } from "@/components/layout/Topbar";

export function DashboardLayout({ children }: PropsWithChildren) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {!isFullscreen ? (
        <SidebarTree
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
          isFullscreen={isFullscreen}
          onOpenNotifications={() => setNotificationOpen(true)}
        />
      ) : null}
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        />
        {isFullscreen ? (
          <div className="sticky top-0 z-20 flex justify-end border-b border-border bg-topbar-bg px-4 py-2">
            <button
              className="rounded-md border border-border bg-surface-card px-2 py-1 text-xs transition-colors hover:bg-sidebar-hover"
              onClick={() => setIsFullscreen(false)}
            >
              Exit Fullscreen
            </button>
          </div>
        ) : null}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <NotificationPanel open={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </div>
  );
}
