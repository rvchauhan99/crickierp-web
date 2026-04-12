import { PropsWithChildren } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { AppToaster } from "@/components/common/AppToaster";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <ProtectedShell>
        <DashboardLayout>{children}</DashboardLayout>
        <AppToaster />
      </ProtectedShell>
    </AuthProvider>
  );
}
