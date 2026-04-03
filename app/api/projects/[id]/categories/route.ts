import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseBody, saveCategoriesSchema, updateCategorySchema } from "@/lib/api/schemas";
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
  const { Category } = await import("@/lib/db/entities/Category");

  const categories = await db.getRepository(Category).find({
    where: { projectId: id },
    order: { sortOrder: "ASC" },
  });

  return NextResponse.json(categories);
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
  const parsed = await parseBody(request, saveCategoriesSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { categories } = parsed.data;

  const db = await getDb();
  const { Category } = await import("@/lib/db/entities/Category");
  const repo = db.getRepository(Category);

  // Clear existing categories for this project
  await repo.delete({ projectId: id });

  // Create new categories
  const saved = await repo.save(
    categories.map((cat, i) =>
      repo.create({
        projectId: id,
        name: cat.name,
        description: cat.description || null,
        sampleComments: cat.sampleComments
          ? JSON.stringify(cat.sampleComments)
          : null,
        isFallback: cat.isFallback ?? false,
        isActive: true,
        sortOrder: i,
        createdBy: cat.isFallback ? "system" : "ai",
      })
    )
  );

  return NextResponse.json(saved);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const parsed = await parseBody(request, updateCategorySchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { categoryId, name, description, isActive } = parsed.data;

  const db = await getDb();
  const { Category } = await import("@/lib/db/entities/Category");
  const repo = db.getRepository(Category);

  const category = await repo.findOneBy({ id: categoryId, projectId: id });
  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  // Cannot delete/deactivate the fallback category
  if (category.isFallback && isActive === false) {
    return NextResponse.json(
      { error: "Cannot deactivate the General Feedback category" },
      { status: 400 }
    );
  }

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await repo.save(category);

  return NextResponse.json(category);
}
