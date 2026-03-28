import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createModel, type LlmProviderConfig } from "@/lib/ai/providers";
import { getDb } from "@/lib/db";
import { decrypt } from "@/lib/ai/encryption";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, apiKey, endpointUrl, modelName } = body;

  let resolvedApiKey = apiKey;

  if (!resolvedApiKey && provider !== "ollama") {
    const db = await getDb();
    const { LlmConfig } = await import("@/lib/db/entities/LlmConfig");
    const config = await db.getRepository(LlmConfig).findOneBy({ provider });
    if (config?.apiKeyEncrypted) {
      resolvedApiKey = decrypt(config.apiKeyEncrypted);
    }
  }

  if (!resolvedApiKey && provider !== "ollama") {
    return NextResponse.json(
      { error: "API key is required for this provider" },
      { status: 400 }
    );
  }

  try {
    const providerConfig: LlmProviderConfig = {
      provider,
      apiKey: resolvedApiKey,
      endpointUrl,
      modelName,
    };

    const model = createModel(providerConfig);

    const { text } = await generateText({
      model,
      prompt: "Say 'Connection successful' in exactly two words.",
      maxOutputTokens: 10,
    });

    return NextResponse.json({
      success: true,
      response: text.trim(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
