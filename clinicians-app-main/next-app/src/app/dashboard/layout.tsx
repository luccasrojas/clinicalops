import { SidebarProvider } from "@/components/ui/sidebar";
import { getClerkAuthenticatedTokenServer } from "@/lib/utils-clerk-server";
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";
import OrganizationGuard from "@/modules/auth/ui/components/organization-guard";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import React from "react";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const authToken = await getClerkAuthenticatedTokenServer();

  return (
    <AuthGuard>
      <OrganizationGuard>
        <SidebarProvider>
          <DashboardSidebar authToken={authToken} />
          {/* could have been a main tag */}
          {/* bg-muted dont know why it had bg muted */}
          <div className="flex flex-col h-screen w-screen">
            <DashboardNavbar />
            {children}
          </div>
        </SidebarProvider>
      </OrganizationGuard>
    </AuthGuard>
  );
};

export default Layout;
