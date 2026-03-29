import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();

  const { ChatMessage } = await import("@/lib/db/entities/ChatMessage");
  const messages = await db.getRepository(ChatMessage).find({
    where: { projectId: id },
    order: { createdAt: "ASC" },
  });

  return NextResponse.json({ messages });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();

  const { ChatMessage } = await import("@/lib/db/entities/ChatMessage");
  await db.getRepository(ChatMessage).delete({ projectId: id });

  return NextResponse.json({ success: true });
}
