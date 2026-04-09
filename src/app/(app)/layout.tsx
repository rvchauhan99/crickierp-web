import { PropsWithChildren } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider } from "@/context/AuthContext";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </NotificationProvider>
    </AuthProvider>
  );
}
