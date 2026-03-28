"use client";

import { NPS_THRESHOLDS } from "@/lib/nps/calculator";

interface CommentRow {
  id: string;
  npsScore: number | null;
  commentText: string | null;
  categoryName: string | null;
  isActionable: boolean;
  hasComment: boolean;
  aiConfidence: number | null;
}

interface DataTableProps {
  comments: CommentRow[];
  sortBy: string;
  sortDir: "ASC" | "DESC";
  onSort: (column: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const COLUMNS = [
  { key: "npsScore", label: "NPS" },
  { key: "category", label: "Category" },
  { key: "rowIndex", label: "Comment" },
  { key: "aiConfidence", label: "Confidence" },
];

export function DataTable({
  comments,
  sortBy,
  sortDir,
  onSort,
  page,
  totalPages,
  onPageChange,
}: DataTableProps) {
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 select-none"
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
                key={row.id}
                className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <td className="px-3 py-2">
                  {row.npsScore !== null && (
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold text-white ${
                        row.npsScore >= NPS_THRESHOLDS.PROMOTER_MIN
                          ? "bg-green-600"
                          : row.npsScore >= NPS_THRESHOLDS.PASSIVE_MIN
                          ? "bg-yellow-500"
                          : "bg-red-600"
                      }`}
                    >
                      {row.npsScore}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  <span className="truncate block max-w-[150px]">
                    {row.categoryName || "\u2014"}
                  </span>
                  {!row.isActionable && row.hasComment && (
                    <span className="text-xs text-red-400">
                      Non-actionable
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-md">
                  <span
                    className="block truncate"
                    title={row.commentText || ""}
                  >
                    {row.commentText || (
                      <span className="text-gray-400 italic">No comment</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs">
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
            className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
