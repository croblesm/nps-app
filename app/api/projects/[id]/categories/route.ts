import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const body = await request.json();
  const { categories } = body as {
    categories: {
      name: string;
      description: string;
      sampleComments?: unknown;
      isFallback?: boolean;
    }[];
  };

  if (!categories || categories.length === 0) {
    return NextResponse.json(
      { error: "At least one category is required" },
      { status: 400 }
    );
  }

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
  const body = await request.json();
  const { categoryId, name, description, isActive } = body;

  if (!categoryId) {
    return NextResponse.json(
      { error: "categoryId is required" },
      { status: 400 }
    );
  }

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
