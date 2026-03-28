"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  commentCount: number;
  npsScore: number | null;
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Projects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            AI-powered NPS analysis for product managers
          </p>
        </div>
        <Link
          href="/new-project"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
        >
          New Project
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">
            No projects yet
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
            Create a project to start analyzing NPS survey data
          </p>
          <Link
            href="/new-project"
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <Link
                href={`/project/${project.id}/dashboard`}
                className="flex-1 min-w-0"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>
                    Created{" "}
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  {project.commentCount > 0 && (
                    <span>{project.commentCount} responses</span>
                  )}
                  {project.npsScore !== null && (
                    <span
                      className={
                        project.npsScore >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      NPS: {project.npsScore}
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={() => handleDelete(project.id, project.name)}
                disabled={deleting === project.id}
                className="ml-4 p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                title="Delete project"
              >
                {deleting === project.id ? "..." : "x"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
