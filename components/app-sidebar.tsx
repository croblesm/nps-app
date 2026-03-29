"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Tags,
  Filter,
  FileText,
  GitFork,
  FolderOpen,
  Settings,
  ChevronsUpDown,
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
}

const PROJECT_NAV_ITEMS = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "upload", label: "Data", icon: FileSpreadsheet, altHref: "structure" },
  { href: "categories", label: "Categories", icon: Tags },
  { href: "noise", label: "Noise Filters", icon: Filter },
  { href: "summary", label: "Summary", icon: FileText },
  { href: "github", label: "GitHub", icon: GitFork },
];

const HOME_NAV_ITEMS = [
  { href: "/", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { data: session } = useSession();

  const projectId = params.id as string | undefined;
  const isProjectMode = pathname.includes("/project/") && projectId;

  const [project, setProject] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then(setProject)
      .catch(() => {});
  }, [projectId]);

  const currentSegment = pathname.split("/").pop();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={isProjectMode ? project?.name ?? "Project" : "NPS Insight Engine"}>
              {isProjectMode ? (
                <Link href={`/project/${projectId}/dashboard`} className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    {project?.name?.[0]?.toUpperCase() ?? "P"}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {project?.name ?? "Loading..."}
                    </span>
                    {project?.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {project.description}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    N
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      NPS Insight Engine
                    </span>
                  </div>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isProjectMode ? "Navigation" : "Menu"}
          </SidebarGroupLabel>
          <SidebarMenu>
            {isProjectMode
              ? PROJECT_NAV_ITEMS.map((item) => {
                  const isActive =
                    currentSegment === item.href ||
                    !!(item.altHref && currentSegment === item.altHref);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={
                          <Link href={`/project/${projectId}/${item.href}`} />
                        }
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              : HOME_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-full"
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={session?.user?.name ?? "Account"}
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {session?.user?.image && (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                    />
                  )}
                  <AvatarFallback className="rounded-lg text-xs">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {session?.user?.name ?? "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {session?.user?.email ?? ""}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
