import { UserProfileDialog } from "@/app/dashboard/_componentsV1/user-profile-dialog";
import SidebarNotesServer from "@/app/dashboard/_componentsV2/sidebar-notes/";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  BotIcon,
  HospitalIcon,
  LightbulbIcon,
  LucideIcon,
  PlusIcon,
  StarIcon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DashboardTrial } from "../dashboard-trial";
import { SidebarLinkButton } from "./sidebar-link-button";
import { auth } from "@clerk/nextjs/server";

export const ICONS = {
  HospitalIcon,
  VideoIcon,
  StarIcon,
};

export interface SidebarSectionItemType {
  icon: keyof typeof ICONS;
  label: string;
  href: string;
}

const firstSection: SidebarSectionItemType[] = [
  {
    icon: "HospitalIcon",
    label: "Sesiones",
    href: "/dashboard/sessions",
  },
  // We will remove this for now
  // {
  //   icon: "VideoIcon",
  //   label: "Simulaciones (IA)",
  //   href: "/dashboard/simulations",
  // },
  // Truly the right abstraction might be to have
  // patients, and a flag for AI or not AI
  // might allow for very sophisticated simulations over time
  // as the schema for a patient becomes more complex
  // and we can have a patient that is or is not AI driven
  // but has a history of sessions, notes, files, etc
  // The data model should certainly remain unified,
  // but the UI can branch off
  // into AI driven or not AI driven patients
  // depending on the use case
  // and we can have a filter for that too
  // in the patients list view
  // Can always be artificial agent first development, then real patients later
  // {
  //   // icon: BotIcon,
  //   icon: BotIcon,
  //   label: "Pacientes virtuales (IA)",
  //   href: "/dashboard/agents",
  // },
];

const secondSection: SidebarSectionItemType[] = [
  {
    icon: "StarIcon",
    label: "Suscribirse",
    href: "/dashboard/upgrade",
  },
];

export const DashboardSidebar = async ({
  authToken,
}: {
  authToken: string | null;
}) => {
  //   const pathname = "/meetings";

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground ">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2">
          <Image src="/logo.jpg" alt="Logo" width={36} height={36} />
          <p className="text-2xl font-semibold text-accent">Prartis</p>
        </Link>
      </SidebarHeader>
      {false && (
        <div className="px-4 py-2">
          {/* maybe should be like most borders color */}
          <Separator
            // className="opacity-10 text-[#5D6B68]"
            className="opacity-100 text-sidebar-border"
          />
        </div>
      )}{" "}
      <SidebarContent>
        <div className="px-4 py-2">
          {/* maybe should be like most borders color */}
          <Separator
            // className="opacity-10 text-[#5D6B68]"
            className="opacity-100 text-sidebar-border"
          />
        </div>
        <SidebarGroup className="sticky top-0 z-10 bg-sidebar">
          <SidebarGroupContent>
            <SidebarMenu>
              {false && (
                <div className="px-2">
                  <Button
                    // onClick={handleNewSession}
                    className="w-full justify-start hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-icons mr-2">add</span>
                    New Note
                  </Button>
                </div>
              )}
              <Button
                // onClick={handleNewSession}
                // className="w-full justify-start hover:bg-primary/90 transition-colors"
                // active:animate-pulse lol
                className="w-full h-10 justify-start px-2! gap-2! text-sm font-medium tracking-tight active:bg-black/90 "
                asChild
              >
                <Link href="/dashboard">
                  <PlusIcon className="size-5!" />
                  <span className="text-sm font-medium tracking-tight">
                    {"Nueva nota"}
                  </span>
                </Link>
              </Button>
              <Button
                // onClick={handleNewSession}
                // className="w-full justify-start hover:bg-primary/90 transition-colors"
                // active:animate-pulse lol
                variant={"accent"}
                className="w-full h-10 justify-start px-2! gap-2! text-sm font-medium tracking-tight "
                asChild
              >
                <Link href="/dashboard/customize">
                  <LightbulbIcon className="size-5!" />
                  <span className="text-sm font-medium tracking-tight">
                    {/* {"Personalizar plantilla"} */}
                    {"Personalizar"}
                  </span>
                </Link>
              </Button>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="px-4 py-2">
          {/* maybe should be like most borders color */}
          <Separator
            // className="opacity-10 text-[#5D6B68]"
            className="opacity-100 text-sidebar-border"
          />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarLinkButton
                    item={{
                      href: item.href,
                      icon: item.icon,
                      label: item.label,
                    }}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {false && (
          <div className="px-4 py-2">
            {/* maybe should be like most borders color */}
            <Separator
              // className="opacity-10 text-[#5D6B68]"
              className="opacity-100 text-sidebar-border"
            />
          </div>
        )}
        {/* Could substitute with billing or something after upgrading */}
        {false && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondSection.map((item) => (
                  // <SidebarMenuItem key={item.href}>
                  //   <SidebarMenuButton
                  //     asChild
                  //     className={cn(
                  //       "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                  //       pathname === item.href &&
                  //         "bg-linear-to-r/oklch border-[#5D6B68]/10"
                  //     )}
                  //     isActive={pathname === item.href}
                  //   >
                  //     <Link href={item.href}>
                  //       <item.icon className="size-5!" />
                  //       <span className="text-sm font-medium tracking-tight">
                  //         {item.label}
                  //       </span>
                  //     </Link>
                  //   </SidebarMenuButton>
                  // </SidebarMenuItem>
                  <SidebarMenuItem key={item.href}>
                    <SidebarLinkButton
                      item={{
                        href: item.href,
                        icon: item.icon,
                        label: item.label,
                      }}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <div className="px-4 py-2">
          {/* maybe should be like most borders color */}
          <Separator
            // className="opacity-10 text-[#5D6B68]"
            className="opacity-100 text-sidebar-border"
          />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="px-2">
                <SidebarNotesServer authToken={authToken} />
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pt-0">
        <DashboardTrial />
        <div className="mt-0 pt-2 border-t border-medical-border">
          <UserProfileDialog />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
