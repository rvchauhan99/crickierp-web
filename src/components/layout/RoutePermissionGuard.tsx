"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { canAccessRoute } from "@/lib/routePermissionMap";

function isLiabilityRoute(pathname: string): boolean {
  return pathname === "/liability" || pathname.startsWith("/liability/") || pathname === "/reports/liability";
}

export function RoutePermissionGuard({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, isBootstrapping } = useAuth();
  const { liabilityModuleEnabled } = usePlatformSettings();

  if (isBootstrapping || !user) {
    return <>{children}</>;
  }

  if (!liabilityModuleEnabled && isLiabilityRoute(pathname)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Module disabled</h1>
        <p className="text-sm text-muted-foreground">
          Liability module is disabled for this deployment. Settlements use bank accounts only.
        </p>
        <Link
          href="/dashboard"
          className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!canAccessRoute(pathname, user.role, user.permissions)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
