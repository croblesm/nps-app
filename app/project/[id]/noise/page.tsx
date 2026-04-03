import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { NoiseClient } from "./noise-client";

export default async function NoisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await assertProjectAccess(id);
  if (!project) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const db = await getDb();
  const { NoiseFilter } = await import("@/lib/db/entities/NoiseFilter");
  const filters = await db.getRepository(NoiseFilter).find({
    where: { projectId: id },
  });

  const serializedFilters = filters.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    filterKeywords: f.filterKeywords || "[]",
    excludeFromNps: f.excludeFromNps,
    isActive: f.isActive,
  }));

  return <NoiseClient initialFilters={serializedFilters} projectId={id} />;
}
