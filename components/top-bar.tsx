"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { Sun, Moon, Settings, LogOut, UserCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActiveProvider {
  provider: string;
  modelName: string;
}

interface ProjectInfo {
  id: string;
  name: string;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  upload: "Data",
  structure: "Structure",
  categories: "Categories",
  noise: "Noise Filters",
  summary: "Summary",
  github: "GitHub",
  settings: "Settings",
  admin: "Account",
  "new-project": "New Project",
};

export function TopBar() {
  const pathname = usePathname();
  const params = useParams();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const projectId = params.id as string | undefined;

  const [active, setActive] = useState<ActiveProvider | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);

  useEffect(() => setMounted(true), []);

  const fetchActive = useCallback(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((configs) => {
        const defaultConfig = configs.find(
          (c: { isDefault: boolean }) => c.isDefault
        );
        setActive(
          defaultConfig
            ? {
                provider: defaultConfig.provider,
                modelName: defaultConfig.modelName,
              }
            : null
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchActive();
    const handler = () => fetchActive();
    window.addEventListener("llm-config-changed", handler);
    return () => window.removeEventListener("llm-config-changed", handler);
  }, [fetchActive]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => setProject({ id: data.id, name: data.name }))
      .catch(() => {});
  }, [projectId]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    if (pathname === "/") {
      return [{ label: "Projects", href: undefined }];
    }

    const crumbs: { label: string; href: string | undefined }[] = [];

    if (segments[0] === "project" && projectId) {
      crumbs.push({ label: "Projects", href: "/" });
      crumbs.push({
        label: project?.name ?? "Project",
        href: `/project/${projectId}/dashboard`,
      });
      const page = segments[2];
      if (page) {
        crumbs.push({
          label: PAGE_LABELS[page] ?? page,
          href: undefined,
        });
      }
    } else {
      const page = segments[0];
      crumbs.push({
        label: PAGE_LABELS[page] ?? page,
        href: undefined,
      });
    }

    return crumbs;
  }, [pathname, projectId, project?.name]);

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <BreadcrumbItem key={`${crumb.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        {active ? (
          <span className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--nps-promoter)] mr-1" />
            {active.provider} / {active.modelName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No LLM configured</span>
        )}

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>

        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-muted px-2 py-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/admin" />}>
                <UserCircle className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              {session?.user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </header>
  );
}
