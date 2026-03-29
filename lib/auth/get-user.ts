import { auth } from "@/lib/auth";

/**
 * Get the authenticated user's ID from the session.
 * Returns null if AUTH_REQUIRED is false and no session exists.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const authRequired = process.env.AUTH_REQUIRED !== "false";
  const session = await auth();

  if (!session?.user?.id) {
    return authRequired ? null : null;
  }

  return session.user.id;
}
