"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Tags,
  Filter,
  FileText,
  ArrowLeft,
  Download,
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
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "upload", label: "Data", icon: FileSpreadsheet, altHref: "structure" },
  { href: "categories", label: "Categories", icon: Tags },
  { href: "noise", label: "Noise Filters", icon: Filter },
  { href: "summary", label: "Summary", icon: FileText },
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
    <div className="min-h-[calc(100vh-49px)]">
      {/* Project header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-3 w-3" />
                All Projects
              </Link>
              {project ? (
                <>
                  <h1 className="text-2xl font-bold text-foreground">
                    {project.name}
                  </h1>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  )}
                </>
              ) : (
                <div className="h-8" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Link href={`/project/${projectId}/summary`}>
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            {NAV_ITEMS.map((item) => {
              const isActive =
                currentPage === item.href ||
                (item.altHref && currentPage === item.altHref);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={`/project/${projectId}/${item.href}`}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
    </div>
  );
}
