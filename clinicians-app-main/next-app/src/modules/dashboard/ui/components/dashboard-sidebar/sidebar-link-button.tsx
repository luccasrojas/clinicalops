// app/dashboard/_components/SidebarLinkButton.tsx
"use client";

import { HospitalIcon, VideoIcon } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarSectionItemType, ICONS } from ".";

interface SidebarLinkButtonProps {
  item: SidebarSectionItemType;
}

export function SidebarLinkButton({ item }: SidebarLinkButtonProps) {
  const pathname = usePathname();

  const ActiveIcon = ICONS[item.icon];

  return (
    <SidebarMenuButton
      asChild
      className={cn(
        "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
        pathname === item.href && "bg-linear-to-r/oklch border-[#5D6B68]/10"
      )}
      isActive={pathname === item.href}
    >
      <Link href={item.href}>
        <ActiveIcon className="size-5" />
        <span className="text-sm font-medium tracking-tight">{item.label}</span>
      </Link>
    </SidebarMenuButton>
  );
}
