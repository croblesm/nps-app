"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Calendar, MessageSquare, TrendingUp, TrendingDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  commentCount: number;
  npsScore: number | null;
  promoterPct: number | null;
  passivePct: number | null;
  detractorPct: number | null;
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Project "${name}" deleted`);
    } else {
      toast.error("Failed to delete project");
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered NPS analysis for product managers
          </p>
        </div>
        <Link href="/new-project">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No projects yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Create a project to start analyzing NPS survey data
            </p>
            <Link href="/new-project">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:border-primary/50 transition-colors group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/project/${project.id}/dashboard`}
                    className="flex-1 min-w-0"
                  >
                    <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1 truncate">
                        {project.description}
                      </CardDescription>
                    )}
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{project.name}&quot; and all
                          its data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(project.id, project.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/project/${project.id}/dashboard`}>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    {project.commentCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {project.commentCount} responses
                      </span>
                    )}
                    {project.npsScore !== null && (
                      <Badge
                        variant={project.npsScore >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {project.npsScore >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        NPS {project.npsScore}
                      </Badge>
                    )}
                    {project.promoterPct !== null && project.passivePct !== null && project.detractorPct !== null && (
                      <div className="flex items-center gap-2 ml-auto">
                        <div className="flex h-2 w-32 rounded-full overflow-hidden bg-muted">
                          <div
                            className="h-full bg-[#22c55e]"
                            style={{ width: `${project.promoterPct}%` }}
                            title={`Promoters: ${project.promoterPct}%`}
                          />
                          <div
                            className="h-full bg-[#eab308]"
                            style={{ width: `${project.passivePct}%` }}
                            title={`Passives: ${project.passivePct}%`}
                          />
                          <div
                            className="h-full bg-[#ef4444]"
                            style={{ width: `${project.detractorPct}%` }}
                            title={`Detractors: ${project.detractorPct}%`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {project.promoterPct}% / {project.passivePct}% / {project.detractorPct}%
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
