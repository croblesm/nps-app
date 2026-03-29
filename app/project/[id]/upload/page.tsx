"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

function columnTypeBadgeVariant(type: string) {
  switch (type.toLowerCase()) {
    case "numeric":
    case "number":
    case "integer":
    case "float":
      return "default" as const;
    case "text":
    case "string":
      return "secondary" as const;
    case "date":
    case "datetime":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setUploadProgress(0);

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
    if (f && f.name.endsWith(".csv")) {
      handleFile(f);
    } else {
      toast.error("Invalid file type", {
        description: "Please upload a CSV file.",
      });
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      setUploadProgress(50);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const data = await res.json();
      if (res.ok) {
        setUploadProgress(100);
        setResult(data);
        if (data.validation.valid) {
          toast.success("Upload successful", {
            description: `${data.filename} validated with ${data.rowCount} rows.`,
          });
        } else {
          toast.warning("Validation issues found", {
            description: `${data.validation.issues.length} issue(s) detected.`,
          });
        }
      } else {
        toast.error("Upload failed", {
          description: data.error || "An unexpected error occurred.",
        });
      }
    } catch {
      toast.error("Upload failed", {
        description: "Could not connect to the server.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Upload Data</h1>
      <p className="text-muted-foreground mb-6">
        Upload your NPS survey data as a CSV file
      </p>

      {/* Drop zone */}
      {!result && (
        <Card
          onDragOver={(e: React.DragEvent) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer transition-colors ${
            dragging
              ? "border-primary ring-2 ring-primary/20"
              : ""
          }`}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {file ? (
              <>
                <FileSpreadsheet className="size-10 text-primary mb-4" />
                <p className="font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="size-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drag and drop a CSV file here, or click to browse
                </p>
              </>
            )}
            <label className="cursor-pointer mt-2">
              <Button variant="outline" type="button" onClick={() => document.getElementById('csv-input')?.click()}>
                Choose File
              </Button>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* Preview table */}
      {preview.length > 0 && !result && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Preview (first 5 rows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {previewHeaders.map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-medium text-muted-foreground"
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
                        className="border-t border-border"
                      >
                        {previewHeaders.map((h) => (
                          <td
                            key={h}
                            className="px-3 py-2 text-foreground truncate max-w-[200px]"
                          >
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress}>
                <span className="text-sm text-muted-foreground">
                  Uploading and validating...
                </span>
              </Progress>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            size="lg"
          >
            {uploading ? (
              <Spinner size="sm" label="Uploading & Validating..." />
            ) : (
              <>
                <Upload className="size-4" />
                Upload &amp; Validate
              </>
            )}
          </Button>
        </div>
      )}

      {/* Validation results */}
      {result && (
        <div className="mt-6 space-y-6">
          {/* Status card */}
          <Card>
            <CardContent className="flex items-start gap-3 pt-4">
              {result.validation.valid ? (
                <CheckCircle className="size-5 text-primary mt-0.5 shrink-0" />
              ) : (
                <XCircle className="size-5 text-destructive mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {result.validation.valid
                    ? "Validation Passed"
                    : "Validation Failed"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.filename} — {result.rowCount} rows,{" "}
                  {result.columns.length} columns
                </p>
                {result.validation.issues.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {result.validation.issues.map((issue, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <AlertTriangle className="size-3.5 text-destructive mt-0.5 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Column summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Column Analysis
              </CardTitle>
              <CardDescription>
                Detected types and null percentages for each column
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {result.columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {col.name}
                      </span>
                      <Badge variant={columnTypeBadgeVariant(col.type)}>
                        {col.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {col.nullPercentage > 0
                        ? `${col.nullPercentage}% null`
                        : "No nulls"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {result.validation.valid && (
            <Button
              size="lg"
              onClick={() =>
                router.push(`/project/${projectId}/structure`)
              }
            >
              Continue to Report Structure
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
