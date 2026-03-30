import { NextResponse } from "next/server";
import { getEmbeddingConfig } from "@/lib/ai/get-embedding-config";

export async function GET() {
  try {
    const config = await getEmbeddingConfig();

    if (!config) {
      return NextResponse.json({
        configured: false,
        provider: null,
        model: null,
      });
    }

    return NextResponse.json({
      configured: true,
      provider: config.provider,
      model: config.embeddingModel,
    });
  } catch {
    return NextResponse.json({
      configured: false,
      provider: null,
      model: null,
    });
  }
}
