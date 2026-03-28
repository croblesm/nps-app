"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
}

const NAV_ITEMS = [
  { href: "upload", label: "Upload Data", step: 1 },
  { href: "structure", label: "Report Structure", step: 2 },
  { href: "categories", label: "Categories", step: 3 },
  { href: "dashboard", label: "Dashboard", step: 4 },
  { href: "noise", label: "Noise Filters", step: 5 },
  { href: "summary", label: "AI Summary", step: 6 },
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
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex-shrink-0">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs text-blue-500 hover:text-blue-400"
          >
            &larr; All Projects
          </Link>
          {project && (
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2 truncate">
              {project.name}
            </h2>
          )}
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.href;
            return (
              <Link
                key={item.href}
                href={`/project/${projectId}/${item.href}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs border border-current flex-shrink-0">
                  {item.step}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
