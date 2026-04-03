import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseBody, saveStructureSchema } from "@/lib/api/schemas";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const db = await getDb();
  const { ReportStructure } = await import("@/lib/db/entities/ReportStructure");
  const structure = await db
    .getRepository(ReportStructure)
    .findOneBy({ projectId: id });

  return NextResponse.json(structure || null);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const parsed = await parseBody(request, saveStructureSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { includedColumns, excludedColumns } = parsed.data;

  const db = await getDb();
  const { ReportStructure } = await import("@/lib/db/entities/ReportStructure");
  const repo = db.getRepository(ReportStructure);

  // Upsert
  let structure = await repo.findOneBy({ projectId: id });
  if (structure) {
    structure.includedColumns = JSON.stringify(includedColumns);
    structure.excludedColumns = JSON.stringify(excludedColumns);
    structure.confirmedAt = new Date();
  } else {
    structure = repo.create({
      projectId: id,
      includedColumns: JSON.stringify(includedColumns),
      excludedColumns: JSON.stringify(excludedColumns),
      confirmedAt: new Date(),
    });
  }

  await repo.save(structure);

  return NextResponse.json(structure);
}
