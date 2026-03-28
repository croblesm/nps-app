import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { encrypt } from "@/lib/ai/encryption";
import { parseBody, saveLlmConfigSchema } from "@/lib/api/schemas";

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

export async function POST(request: Request) {
  const parsed = await parseBody(request, saveLlmConfigSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { provider, apiKey, endpointUrl, modelName, isDefault } = parsed.data;

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
