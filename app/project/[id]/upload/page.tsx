import { getDb } from "@/lib/db";
import { assertProjectAccess } from "@/lib/auth/assert-project-access";
import { UploadClient } from "./upload-client";

export default async function UploadPage({
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
  const { Comment } = await import("@/lib/db/entities/Comment");
  const repo = db.getRepository(Comment);
  const rowCount = await repo.count({ where: { projectId: id } });

  // Fetch sample rows for preview
  let sampleRows: { rowIndex: number; npsScore: number | null; commentText: string | null }[] = [];
  if (rowCount > 0) {
    const samples = await repo.find({
      where: { projectId: id },
      order: { rowIndex: "ASC" },
      take: 5,
    });
    sampleRows = samples.map((c) => ({
      rowIndex: c.rowIndex,
      npsScore: c.npsScore,
      commentText: c.commentText,
    }));
  }

  return (
    <UploadClient
      initialDataExists={rowCount > 0}
      initialRowCount={rowCount}
      sampleRows={sampleRows}
    />
  );
}
