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
  const rowCount = await db.getRepository(Comment).count({ where: { projectId: id } });

  return (
    <UploadClient
      initialDataExists={rowCount > 0}
      initialRowCount={rowCount}
    />
  );
}
