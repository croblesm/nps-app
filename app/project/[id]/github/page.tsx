"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  GitFork,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface GitHubConfigData {
  id: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  hasToken: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GitHubIssueData {
  id: string;
  githubIssueNumber: number;
  githubUrl: string;
  title: string;
  labels: string | null;
  status: string;
  createdAt: string;
}

export default function GitHubPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [config, setConfig] = useState<GitHubConfigData | null>(null);
  const [issues, setIssues] = useState<GitHubIssueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [pat, setPat] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, issuesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/github`),
        fetch(`/api/projects/${projectId}/github/issues`),
      ]);
      const configData = await configRes.json();
      const issuesData = await issuesRes.json();

      if (configData) {
        setConfig(configData);
        setRepoOwner(configData.repoOwner);
        setRepoName(configData.repoName);
      }
      setIssues(Array.isArray(issuesData) ? issuesData : []);
    } catch {
      setError("Failed to load GitHub configuration");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoOwner, repoName, pat }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save configuration");
        return;
      }

      const data = await res.json();
      setConfig(data);
      setPat("");
      setSuccess("GitHub configuration saved and validated successfully!");
    } catch {
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshStatuses() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/github/issues`, {
        method: "PATCH",
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          GitHub Integration
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect a GitHub repository to export NPS feedback as issues.
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5" />
            Repository Configuration
          </CardTitle>
          <CardDescription>
            Configure the GitHub repository where NPS feedback issues will be
            created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Connected to{" "}
                <span className="font-medium">
                  {config.repoOwner}/{config.repoName}
                </span>
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                {success}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repoOwner">Repository Owner</Label>
              <Input
                id="repoOwner"
                placeholder="e.g., microsoft"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repoName">Repository Name</Label>
              <Input
                id="repoName"
                placeholder="e.g., vscode-mssql"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pat" className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Personal Access Token
            </Label>
            <Input
              id="pat"
              type="password"
              placeholder={
                config?.hasToken
                  ? "Token saved — enter a new one to update"
                  : "ghp_xxxxxxxxxxxxxxxxxxxx"
              }
              value={pat}
              onChange={(e) => setPat(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Requires <code>repo</code> scope. Your token is encrypted at rest.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !repoOwner || !repoName || !pat}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {config ? "Update & Validate" : "Test & Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Created Issues */}
      {issues.length === 0 && config && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No issues created yet. Go to the <strong>Dashboard</strong> tab to export categories or selected comments as GitHub issues.
            </p>
          </CardContent>
        </Card>
      )}
      {issues.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Created Issues
                  <Badge variant="secondary">{issues.length}</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStatuses}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh Status"}
                </Button>
              </div>
              <CardDescription>
                Issues created from NPS feedback in this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {issues.map((issue) => {
                  const labels: string[] = issue.labels
                    ? JSON.parse(issue.labels)
                    : [];
                  return (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-mono text-muted-foreground">
                          #{issue.githubIssueNumber}
                        </span>
                        <Badge
                          variant={issue.status === "open" ? "default" : "secondary"}
                          className={`text-xs ${issue.status === "open" ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
                        >
                          {issue.status}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {issue.title}
                        </span>
                        <div className="flex items-center gap-1">
                          {labels.map((label) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="text-xs"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <a
                        href={issue.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
