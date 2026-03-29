import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { getActiveModel } from "@/lib/ai/get-model";
import { buildAssistantSystemPrompt } from "@/lib/ai/assistant-prompts";
import { parseBody } from "@/lib/api/schemas";

const assistantSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  page: z.string().min(1, "Page name is required"),
  message: z.string().min(1, "Message is required").max(2000),
  pageContext: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, assistantSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { page, message, pageContext } = parsed.data;

  // Check if LLM is configured
  let model;
  try {
    model = await getActiveModel();
  } catch {
    return NextResponse.json(
      {
        error:
          "No LLM provider configured. Go to Settings to set one up.",
        code: "NO_LLM_CONFIGURED",
      },
      { status: 400 }
    );
  }

  const systemPrompt = buildAssistantSystemPrompt(page, pageContext || {});

  const { text: responseText } = await generateText({
    model,
    system: systemPrompt,
    prompt: message,
  });

  return NextResponse.json({ response: responseText });
}
