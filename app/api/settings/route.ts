import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { encrypt } from "@/lib/ai/encryption";

export async function GET() {
  const db = await getDb();
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  const repo = db.getRepository(LlmConfig);
  const configs = await repo.find();

  const masked = configs.map((c) => ({
    ...c,
    apiKeyEncrypted: c.apiKeyEncrypted ? "••••••••" : null,
    hasApiKey: !!c.apiKeyEncrypted,
  }));

  return NextResponse.json(masked);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, apiKey, endpointUrl, modelName, isDefault } = body;

  if (!provider || !modelName) {
    return NextResponse.json(
      { error: "Provider and model name are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  const repo = db.getRepository(LlmConfig);

  if (isDefault) {
    await repo.update({}, { isDefault: false });
  }

  let config = await repo.findOneBy({ provider });

  if (config) {
    config.modelName = modelName;
    config.endpointUrl = endpointUrl || null;
    config.isDefault = isDefault ?? config.isDefault;
    if (apiKey) {
      config.apiKeyEncrypted = encrypt(apiKey);
    }
  } else {
    config = repo.create({
      provider,
      apiKeyEncrypted: apiKey ? encrypt(apiKey) : null,
      endpointUrl: endpointUrl || null,
      modelName,
      isDefault: isDefault ?? false,
    });
  }

  await repo.save(config);

  return NextResponse.json({
    id: config.id,
    provider: config.provider,
    modelName: config.modelName,
    isDefault: config.isDefault,
    hasApiKey: !!config.apiKeyEncrypted,
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const db = await getDb();
  const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
  await db.getRepository(LlmConfig).delete(id);

  return NextResponse.json({ success: true });
}
