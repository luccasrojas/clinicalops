import React from "react";
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";
import OrganizationGuard from "@/modules/auth/ui/components/organization-guard";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  // make bg-black later
  return (
    <AuthGuard>
      {/* not sure if I need org guard */}
      <OrganizationGuard>
        <div className="h-screen bg-black">{children}</div>
      </OrganizationGuard>
    </AuthGuard>
  );
};

export default Layout;
