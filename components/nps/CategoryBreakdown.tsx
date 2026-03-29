"use client";

import { GitFork } from "lucide-react";

interface CategoryBreakdownProps {
  categories: { name: string; count: number; percentage: number }[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  githubEnabled?: boolean;
  onExportToGitHub?: (categoryName: string, commentCount: number) => void;
}

export function CategoryBreakdown({
  categories,
  activeCategory,
  onCategoryChange,
  githubEnabled,
  onExportToGitHub,
}: CategoryBreakdownProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
      {categories.map((cat) => (
        <div
          key={cat.name}
          className={`p-3 rounded-lg text-left text-sm transition-colors ${
            activeCategory === cat.name
              ? "bg-accent ring-1 ring-primary"
              : "bg-card ring-1 ring-foreground/10 hover:ring-foreground/20"
          }`}
        >
          <button
            onClick={() =>
              onCategoryChange(activeCategory === cat.name ? "" : cat.name)
            }
            className="w-full text-left"
          >
            <div className="font-medium text-foreground truncate">
              {cat.name}
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {cat.count} ({cat.percentage}%)
            </div>
          </button>
          {githubEnabled && onExportToGitHub && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportToGitHub(cat.name, cat.count);
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={`Export "${cat.name}" to GitHub`}
            >
              <GitFork className="size-3" />
              Export to GitHub
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
