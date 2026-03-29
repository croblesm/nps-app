"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [analysisHints, setAnalysisHints] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setSaving(true);
    setError("");

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
        router.push(`/project/${project.id}/upload`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create project");
      }
    } catch {
      setError("Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-blue-500 hover:text-blue-400"
        >
          &larr; Back to Projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          New Project
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Provide details about the product you want to analyze
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Product / Tool Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., MSSQL Extension for VS Code"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the product and what the NPS data covers..."
            rows={3}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="analysisHints"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Analysis Focus{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="analysisHints"
            value={analysisHints}
            onChange={(e) => setAnalysisHints(e.target.value)}
            placeholder="Tell the AI what themes to look for, e.g.: Focus on competitor comparisons (SSMS, Azure Data Studio), performance issues, and missing features..."
            rows={3}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Guides the AI when discovering categories from your NPS comments
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {saving && (
          <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Spinner size="sm" label="Creating your new project..." />
          </div>
        )}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {saving ? <Spinner size="sm" label="Creating..." /> : "Create Project & Upload Data"}
        </button>
      </form>
    </main>
  );
}
