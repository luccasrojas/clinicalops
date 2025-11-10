import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Agent } from "http";
import { ChevronRightIcon, MoreVerticalIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { StatusBadgeIcon } from "./columns";

interface Props {
  meetingId: string;
  meetingName: string;
  onEdit: () => void;
  onRemove: () => void;
  isSimulation?: boolean;
  status: string;
}

export const MeetingIdViewHeader = ({
  meetingId,
  meetingName,
  onEdit,
  onRemove,
  isSimulation = true,
  status,
}: Props) => {
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="font-medium text-xl">
              <Link
                href={`/dashboard/${isSimulation ? "simulations" : "sessions"}`}
              >
                {isSimulation == true ? "Mis simulaciones" : "Mis sesiones"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-foreground text-xl font-medium [&>svg]:size-4">
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="font-medium text-xl text-foreground"
            >
              <Link
                href={`/dashboard/${
                  isSimulation ? "simulations" : "sessions"
                }/${meetingId}`}
              >
                {meetingName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <StatusBadgeIcon status={status} />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Without modal={false}, the dialog that this dropdown opens cause the website to get unclickable */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"}>
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon className="size-4 text-black" />
            Editar
          </DropdownMenuItem>
          {/* <DropdownMenuItem onClick={onRemove}>
            <PencilIcon className="size-4 text-black" />
            Eliminar
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
