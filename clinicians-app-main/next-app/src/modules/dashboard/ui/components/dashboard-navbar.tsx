"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeftCloseIcon, PanelLeftIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardCommand } from "./dashboard-command";
import { SettingsSheet } from "@/app/dashboard/_componentsV1/settings-sheet";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export const DashboardNavbar = () => {
  const auth = useAuth();

  const { state, setOpen, setOpenMobile, toggleSidebar, isMobile } =
    useSidebar();

  const [commandOpen, setCommandOpen] = useState(false);

  // Toggle sidebar on mobile on navigation change
  const pathname = usePathname();
  useEffect(() => {
    if (isMobile) {
      // toggleSidebar();
      setOpen(false);
      setOpenMobile(false);
    }
  }, [pathname]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      {false && (
        <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
      )}
      {/* // should probably be bg-sidebar based on design but we'll see */}
      <nav
        // className="flex px-4 gap-x-2 items-center py-3 border-b bg-background"
        // className="flex px-4 gap-x-2 items-center py-3 border-b bg-sidebar"
        className="flex px-4 gap-x-2 items-center justify-between py-3 border-b bg-sidebar overflow-clip"
      >
        <div className="flex items-center gap-x-2">
          <Button className="size-9" variant="outline2" onClick={toggleSidebar}>
            {state === "collapsed" || isMobile ? (
              <PanelLeftIcon className="size-4" />
            ) : (
              <PanelLeftCloseIcon className="size-4" />
            )}
          </Button>
          {false && (
            <Button
              //   probably bg should be the same kind of hover as the side bar
              // className="h-9 w-[240px] justify-start font-normal text-muted-foreground hover:text-muted-foreground"
              className="hidden md:inline-flex hover:bg-medical-hover h-9 w-[240px] justify-start font-normal text-muted-foreground hover:text-muted-foreground"
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen((open) => !open)}
            >
              <SearchIcon />
              Buscar
              <kbd
                // className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground "
                className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-medical-hover px-1.5 font-mono text-[10px] font-medium text-muted-foreground "
              >
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-x-2">
          <Button variant={"link"} asChild>
            <Link
              href="https://prartis.canny.io/solicitudes-de-funciones"
              className="font-medium"
              target="_blank"
              rel="noreferrer"
            >
              {"Solicitar una función"}
            </Link>
          </Button>

          <SettingsSheet />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-medical-border hover:bg-medical-hover"
          >
            <span className="material-icons text-sm">logout</span>
          </Button>
        </div>
      </nav>
    </>
  );
};
