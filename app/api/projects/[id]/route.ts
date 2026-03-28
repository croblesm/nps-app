import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseBody, updateProjectSchema } from "@/lib/api/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");

  const project = await db.getRepository(Project).findOneBy({ id });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = await parseBody(request, updateProjectSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const repo = db.getRepository(Project);

  const project = await repo.findOneBy({ id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (parsed.data.name !== undefined) project.name = parsed.data.name;
  if (parsed.data.description !== undefined) project.description = parsed.data.description;

  await repo.save(project);
  return NextResponse.json(project);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");

  const result = await db.getRepository(Project).delete(id);

  if (result.affected === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
