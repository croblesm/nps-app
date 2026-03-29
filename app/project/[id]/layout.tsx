"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Upload,
  Columns3,
  Tags,
  LayoutDashboard,
  Filter,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
}

const NAV_ITEMS = [
  { href: "upload", label: "Upload Data", icon: Upload },
  { href: "structure", label: "Report Structure", icon: Columns3 },
  { href: "categories", label: "Categories", icon: Tags },
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "noise", label: "Noise Filters", icon: Filter },
  { href: "summary", label: "AI Summary", icon: FileText },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then(setProject)
      .catch(() => {});
  }, [projectId]);

  const currentPage = pathname.split("/").pop();

  return (
    <div className="flex min-h-[calc(100vh-49px)]">
      <aside className="w-56 border-r border-border bg-card p-4 flex-shrink-0">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3 mr-1" />
              All Projects
            </Button>
          </Link>
          {project && (
            <h2 className="text-sm font-semibold text-foreground mt-2 truncate px-2">
              {project.name}
            </h2>
          )}
        </div>

        <Separator className="mb-3" />

        <nav className="space-y-1">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = currentPage === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`/project/${projectId}/${item.href}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                <span className={cn(
                  "ml-auto text-[10px] font-medium w-4 h-4 flex items-center justify-center rounded-full",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
