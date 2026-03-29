"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [analysisHints, setAnalysisHints] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          analysisHints: analysisHints.trim() || null,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        toast.success("Project created");
        router.push(`/project/${project.id}/upload`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create project");
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Project</CardTitle>
          <CardDescription>
            Provide details about the product you want to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Product / Tool Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., MSSQL Extension for VS Code"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the product and what the NPS data covers..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysisHints" className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Analysis Focus
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="analysisHints"
                value={analysisHints}
                onChange={(e) => setAnalysisHints(e.target.value)}
                placeholder="Tell the AI what themes to look for, e.g.: Focus on competitor comparisons (SSMS, Azure Data Studio), performance issues, and missing features..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Guides the AI when discovering categories from your NPS comments
              </p>
            </div>

            {saving && (
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                <Spinner size="sm" label="Creating your new project..." />
              </div>
            )}

            <Button type="submit" disabled={saving || !name.trim()} className="w-full">
              {saving ? (
                <Spinner size="sm" label="Creating..." />
              ) : (
                "Create Project & Upload Data"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
