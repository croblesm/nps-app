import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { parseBody } from "@/lib/api/schemas";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(255).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export async function GET() {
  const session = await auth();
  const authRequired = process.env.AUTH_REQUIRED !== "false";

  if (!session?.user?.id && !authRequired) {
    // Dev mode: return first user from DB if available
    try {
      const db = await getDb();
      const { User } = await import("@/lib/db/entities/User");
      const firstUser = await db.getRepository(User).findOne({ order: { createdAt: "ASC" } });
      if (firstUser) {
        return NextResponse.json({
          name: firstUser.name,
          email: firstUser.email,
          image: firstUser.image,
          provider: firstUser.provider,
          hasPassword: !!firstUser.password,
        });
      }
    } catch {
      // Fall through to stub
    }
    return NextResponse.json({
      name: "Dev User",
      email: "dev@localhost",
      image: null,
      provider: null,
      hasPassword: false,
    });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const { User } = await import("@/lib/db/entities/User");
  const user = await db.getRepository(User).findOneBy({ id: session.user.id });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    image: user.image,
    provider: user.provider,
    hasPassword: !!user.password,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const authRequired = process.env.AUTH_REQUIRED !== "false";

  if (!session?.user?.id && !authRequired) {
    const parsed = await parseBody(request, updateProfileSchema);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    // Dev mode: update first user in DB if one exists
    try {
      const db = await getDb();
      const { User } = await import("@/lib/db/entities/User");
      const repo = db.getRepository(User);
      const firstUser = await repo.findOne({ order: { createdAt: "ASC" } });
      if (firstUser && parsed.data.name) {
        firstUser.name = parsed.data.name;
        await repo.save(firstUser);
        return NextResponse.json({ name: firstUser.name, email: firstUser.email });
      }
    } catch {
      // Fall through to stub response
    }
    return NextResponse.json({ name: parsed.data.name || "Dev User", email: "dev@localhost" });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(request, updateProfileSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = parsed.data;

  const db = await getDb();
  const { User } = await import("@/lib/db/entities/User");
  const repo = db.getRepository(User);

  const user = await repo.findOneBy({ id: session.user.id });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update name
  if (name !== undefined) {
    user.name = name.trim();
  }

  // Update password
  if (currentPassword && newPassword) {
    if (!user.password) {
      return NextResponse.json(
        { error: "No password set — this account uses OAuth login" },
        { status: 400 }
      );
    }
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    user.password = await hash(newPassword, 12);
  }

  await repo.save(user);
  return NextResponse.json({ name: user.name, email: user.email });
}
