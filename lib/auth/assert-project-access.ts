import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/get-user";

/**
 * Verify the current user owns the given project.
 * Returns the project if access is granted, or null if not.
 * When AUTH_REQUIRED=false, ownership check is skipped.
 */
export async function assertProjectAccess(projectId: string) {
  const authRequired = process.env.AUTH_REQUIRED !== "false";
  const userId = await getCurrentUserId();

  const db = await getDb();
  const { Project } = await import("@/lib/db/entities/Project");

  const where = authRequired && userId ? { id: projectId, userId } : { id: projectId };
  return db.getRepository(Project).findOneBy(where);
}
