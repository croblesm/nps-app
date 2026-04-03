"use client";

import { useState, useEffect, useRef } from "react";
import { NPS_THRESHOLDS } from "@/lib/nps/calculator";
import { Button } from "@/components/ui/button";

const GitHubIcon = () => (
  <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

export interface DataTableComment {
  id: string;
  npsScore: number | null;
  commentText: string | null;
  categoryName: string | null;
  isActionable: boolean;
  hasComment: boolean;
  aiConfidence: number | null;
}

interface DataTableProps<T extends DataTableComment> {
  comments: T[];
  sortBy: string;
  sortDir: "ASC" | "DESC";
  onSort: (column: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  githubEnabled?: boolean;
  onExportSelected?: (comments: T[]) => void;
}

const COLUMNS = [
  { key: "npsScore", label: "NPS" },
  { key: "category", label: "Category" },
  { key: "rowIndex", label: "Comment" },
  { key: "aiConfidence", label: "Confidence" },
];

export function DataTable<T extends DataTableComment>({
  comments,
  sortBy,
  sortDir,
  onSort,
  page,
  totalPages,
  onPageChange,
  githubEnabled,
  onExportSelected,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const prevCommentsRef = useRef(comments);

  // Reset selection when data changes (page, filter, sort)
  useEffect(() => {
    if (prevCommentsRef.current !== comments) {
      setSelected(new Set());
      prevCommentsRef.current = comments;
    }
  }, [comments]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === comments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(comments.map((c) => c.id)));
    }
  };

  const selectedComments = comments.filter((c) => selected.has(c.id));

  return (
    <>
      {githubEnabled && selected.size > 0 && onExportSelected && (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted border border-border">
          <span className="text-sm text-foreground">
            {selected.size} comment{selected.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onExportSelected(selectedComments);
              setSelected(new Set());
            }}
          >
            <GitHubIcon />
            <span className="ml-1.5">Create Issue</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {githubEnabled && (
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={comments.length > 0 && selected.size === comments.length}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
              )}
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span className="ml-1">
                      {sortDir === "ASC" ? "\u2191" : "\u2193"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comments.map((row) => (
              <tr
                id={`comment-${row.id}`}
                key={row.id}
                className={`border-t border-border hover:bg-muted/50 ${
                  selected.has(row.id) ? "bg-accent/50" : ""
                }`}
              >
                {githubEnabled && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-border"
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  {row.npsScore !== null && (
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold text-white ${
                        row.npsScore >= NPS_THRESHOLDS.PROMOTER_MIN
                          ? "bg-[var(--nps-promoter)]"
                          : row.npsScore >= NPS_THRESHOLDS.PASSIVE_MIN
                          ? "bg-[var(--nps-passive)]"
                          : "bg-[var(--nps-detractor)]"
                      }`}
                    >
                      {row.npsScore}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <span className="truncate block max-w-[150px]">
                    {row.categoryName || "\u2014"}
                  </span>
                  {!row.isActionable && row.hasComment && (
                    <span className="text-xs text-destructive">
                      Non-actionable
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-foreground max-w-md">
                  <span
                    className="block truncate"
                    title={row.commentText || ""}
                  >
                    {row.commentText || (
                      <span className="text-muted-foreground italic">No comment</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground text-xs">
                  {row.aiConfidence !== null
                    ? `${Math.round(row.aiConfidence * 100)}%`
                    : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded text-sm bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded text-sm bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
