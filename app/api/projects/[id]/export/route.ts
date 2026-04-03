import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";

// Export filtered CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const db = await getDb();

  if (format === "metadata") {
    // Export project metadata (no raw data)
    const { Category } = await import("@/lib/db/entities/Category");
    const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
    const { ReportStructure } = await import("@/lib/db/entities/ReportStructure");
    const categories = await db.getRepository(Category).find({ where: { projectId: id } });
    const noiseFilters = await db.getRepository(NoiseFilter).find({ where: { projectId: id } });
    const structure = await db.getRepository(ReportStructure).findOneBy({ projectId: id });

    const metadata = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      project: {
        name: project?.name,
        description: project?.description,
      },
      reportStructure: structure
        ? {
            includedColumns: JSON.parse(structure.includedColumns || "[]"),
            excludedColumns: JSON.parse(structure.excludedColumns || "[]"),
          }
        : null,
      categories: categories.map((c) => ({
        name: c.name,
        description: c.description,
        isFallback: c.isFallback,
        createdBy: c.createdBy,
      })),
      noiseFilters: noiseFilters.map((nf) => ({
        name: nf.name,
        description: nf.description,
        filterKeywords: JSON.parse(nf.filterKeywords || "[]"),
        excludeFromNps: nf.excludeFromNps,
      })),
    };

    return new NextResponse(JSON.stringify(metadata, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${(project?.name || "project").replace(/[^a-zA-Z0-9]/g, "_")}_metadata_${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  }

  // CSV export
  const { Comment } = await import("@/lib/db/entities/Comment");
  const comments = await db.getRepository(Comment).find({
    where: { projectId: id },
    relations: ["category"],
    order: { rowIndex: "ASC" },
  });

  // Build CSV
  const headers = [
    "NPS",
    "Category",
    "Actionable",
    "Noise",
    "Confidence",
    "Comment",
    "AI Reasoning",
  ];

  const rows = comments.map((c) => [
    c.npsScore ?? "",
    c.category?.name || "",
    c.isActionable ? "Yes" : "No",
    c.isNoise ? "Yes" : "No",
    c.aiConfidence ? `${Math.round(c.aiConfidence * 100)}%` : "",
    `"${(c.commentText || "").replace(/"/g, '""')}"`,
    `"${(c.aiReasoning || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${(project?.name || "export").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
