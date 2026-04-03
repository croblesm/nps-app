import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { analyzeColumns, validateStructure, MAX_FILE_SIZE } from "@/lib/csv/validator";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file || !projectId) {
    return NextResponse.json(
      { error: "File and projectId are required" },
      { status: 400 }
    );
  }

  // File size check
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Parse CSV
  const text = await file.text();
  let rows: Record<string, unknown>[];

  try {
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (result.errors.length > 0) {
      const criticalErrors = result.errors.filter(
        (e) => e.type === "Delimiter" || e.type === "FieldMismatch"
      );
      if (criticalErrors.length > 0) {
        return NextResponse.json(
          {
            error: "CSV parsing failed",
            details: criticalErrors.map((e) => e.message),
          },
          { status: 400 }
        );
      }
    }

    rows = result.data as Record<string, unknown>[];
  } catch {
    return NextResponse.json(
      { error: "Failed to parse CSV file. Ensure it is a valid CSV." },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "CSV file is empty or has no data rows" },
      { status: 400 }
    );
  }

  // Analyze columns
  const columns = analyzeColumns(rows);
  const validation = validateStructure(columns);

  // Save data source record
  const db = await getDb();
  const { DataSource } = await import("@/lib/db/entities/DataSource");
  const repo = db.getRepository(DataSource);

  // Remove any existing data source for this project
  await repo.delete({ projectId });

  const dataSource = repo.create({
    projectId,
    filename: file.name,
    rowCount: rows.length,
    columns: JSON.stringify(columns),
    validationStatus: validation.valid ? "valid" : "invalid",
    validationNotes: JSON.stringify({
      issues: validation.issues,
      columnCount: columns.length,
    }),
  });

  await repo.save(dataSource);

  // Store raw rows as comments (without classification yet)
  if (validation.valid) {
    const { Comment } = await import("@/lib/db/entities/Comment");
    const commentRepo = db.getRepository(Comment);

    // Clear existing comments for this project
    await commentRepo.delete({ projectId });

    // Find likely NPS and comment columns
    const npsCol = columns.find((c) => c.type === "numeric" && c.name.toLowerCase().includes("nps"));
    const commentCol = columns.find((c) => c.type === "text" && c.name.toLowerCase().includes("comment"));

    // Insert comments in batches — MSSQL has a 2,100 parameter limit per query
    // Each Comment has ~12 columns, so 50 rows × 12 = 600 params (safe margin)
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((row, idx) => {
        const npsScore = npsCol ? Number(row[npsCol.name]) : null;
        const commentText = commentCol ? String(row[commentCol.name] ?? "") : null;
        const hasComment = !!commentText && commentText.trim().length > 0;

        return commentRepo.create({
          projectId,
          rowIndex: i + idx,
          rawData: JSON.stringify(row),
          npsScore: npsScore !== null && !isNaN(npsScore) ? npsScore : null,
          commentText: commentText || null,
          hasComment,
          metadata: JSON.stringify(row),
        });
      });

      await commentRepo.save(batch);
    }

    // Re-apply active noise filters to newly uploaded comments
    const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
    const activeFilters = await db.getRepository(NoiseFilter).find({
      where: { projectId, isActive: true },
    });
    for (const filter of activeFilters) {
      const keywords: string[] = JSON.parse(filter.filterKeywords || "[]");
      if (keywords.length === 0) continue;
      const conditions = keywords.map((_, ki) => `commentText LIKE :kw${ki}`);
      const kwParams: Record<string, string> = {};
      keywords.forEach((kw, ki) => { kwParams[`kw${ki}`] = `%${kw}%`; });
      await commentRepo
        .createQueryBuilder()
        .update()
        .set({ isNoise: true })
        .where("projectId = :projectId", { projectId })
        .andWhere(`(${conditions.join(" OR ")})`, kwParams)
        .execute();
    }
  }

  return NextResponse.json({
    dataSourceId: dataSource.id,
    filename: file.name,
    rowCount: rows.length,
    columns,
    validation,
  });
}
