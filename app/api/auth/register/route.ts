import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { parseBody } from "@/lib/api/schemas";

const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, registerSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const db = await getDb();
  const { User } = await import("@/lib/db/entities/User");
  const repo = db.getRepository(User);

  const existing = await repo.findOneBy({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hash(password, 12);
  const user = repo.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  try {
    await repo.save(user);
  } catch (err: unknown) {
    // Handle concurrent registration race condition (MSSQL unique constraint error 2627)
    if (
      err instanceof Error &&
      (err.message.includes("UNIQUE") ||
        err.message.includes("duplicate") ||
        (err as unknown as Record<string, unknown>).number === 2627)
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email },
    { status: 201 }
  );
}
