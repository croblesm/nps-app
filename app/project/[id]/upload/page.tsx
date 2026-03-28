"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import { Spinner } from "@/components/ui/Spinner";

interface ColumnInfo {
  name: string;
  type: string;
  nullCount: number;
  nullPercentage: number;
  sampleValues: string[];
}

interface UploadResult {
  dataSourceId: string;
  filename: string;
  rowCount: number;
  columns: ColumnInfo[];
  validation: { valid: boolean; issues: string[] };
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError("");

    // Client-side preview: first 5 rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        preview: 5,
      });
      setPreviewHeaders(parsed.meta.fields || []);
      setPreview(parsed.data as Record<string, unknown>[]);
    };
    reader.readAsText(f);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
    else setError("Please upload a CSV file");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Upload Data</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Upload your NPS survey data as a CSV file
      </p>

      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
              : "border-gray-300 dark:border-gray-700"
          }`}
        >
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {file
              ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
              : "Drag and drop a CSV file here, or click to browse"}
          </p>
          <label className="inline-block px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer text-sm">
            Choose File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && !result && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Preview (first 5 rows)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {previewHeaders.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-200 dark:border-gray-800"
                  >
                    {previewHeaders.map((h) => (
                      <td
                        key={h}
                        className="px-3 py-2 text-gray-900 dark:text-gray-100 truncate max-w-[200px]"
                      >
                        {String(row[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uploading && (
            <div className="mt-4 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Spinner size="sm" label="Uploading and validating your CSV data..." />
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {uploading ? <Spinner size="sm" label="Uploading & Validating..." /> : "Upload & Validate"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Validation results */}
      {result && (
        <div className="mt-6 space-y-6">
          <div
            className={`p-4 rounded-lg ${
              result.validation.valid
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <h2
              className={`font-semibold ${
                result.validation.valid
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}
            >
              {result.validation.valid
                ? "Validation Passed"
                : "Validation Failed"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {result.filename} — {result.rowCount} rows,{" "}
              {result.columns.length} columns
            </p>
            {result.validation.issues.length > 0 && (
              <ul className="mt-2 text-sm space-y-1">
                {result.validation.issues.map((issue, i) => (
                  <li key={i} className="text-gray-600 dark:text-gray-400">
                    &bull; {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Column summary */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Column Analysis
            </h2>
            <div className="grid gap-2">
              {result.columns.map((col) => (
                <div
                  key={col.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {col.name}
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {col.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {col.nullPercentage > 0
                      ? `${col.nullPercentage}% null`
                      : "No nulls"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.validation.valid && (
            <button
              onClick={() =>
                router.push(`/project/${projectId}/structure`)
              }
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Continue to Report Structure
            </button>
          )}
        </div>
      )}
    </div>
  );
}
