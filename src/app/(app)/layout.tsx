import { PropsWithChildren } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProtectedShell>
          <DashboardLayout>{children}</DashboardLayout>
        </ProtectedShell>
      </NotificationProvider>
    </AuthProvider>
  );
}
