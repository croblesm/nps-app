import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { StructureClient } from "./structure-client";

export default async function StructurePage({
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
  const { ReportStructure } = await import("@/lib/db/entities/ReportStructure");
  const structure = await db.getRepository(ReportStructure).findOneBy({ projectId: id });

  const initialStructure = structure
    ? {
        includedColumns: JSON.parse(structure.includedColumns || "[]") as string[],
        excludedColumns: JSON.parse(structure.excludedColumns || "[]") as string[],
      }
    : null;

  return <StructureClient initialStructure={initialStructure} />;
}
