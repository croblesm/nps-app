import { auth } from "@/lib/auth";

/**
 * Get the authenticated user's ID from the session.
 * When AUTH_REQUIRED=false (local dev), returns the first user from DB
 * or a fixed dev UUID if no users exist.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const authRequired = process.env.AUTH_REQUIRED !== "false";
  const session = await auth();

  if (session?.user?.id) {
    return session.user.id;
  }

  if (!authRequired) {
    // Dev mode: return first user from DB for data consistency
    try {
      const { getDb } = await import("@/lib/db");
      const { User } = await import("@/lib/db/entities/User");
      const db = await getDb();
      const firstUser = await db.getRepository(User).findOne({
        order: { createdAt: "ASC" },
      });
      return firstUser?.id ?? null;
    } catch {
      // User table may not exist yet — return null silently
      return null;
    }
  }

  return null;
}
