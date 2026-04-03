import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseBody, updateProjectSchema } from "@/lib/api/schemas";
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

  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  const repo = db.getRepository(Project);

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
  const project = await assertProjectAccess(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");
  await db.getRepository(Project).delete(id);

  return NextResponse.json({ success: true });
}
