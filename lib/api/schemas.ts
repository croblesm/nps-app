import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(2000).nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const saveLlmConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai", "azure-openai", "ollama"]),
  apiKey: z.string().optional(),
  endpointUrl: z.string().url().max(500).optional().or(z.literal("")),
  modelName: z.string().min(1, "Model name is required").max(100),
  isDefault: z.boolean().optional(),
});

export const testLlmSchema = z.object({
  provider: z.enum(["anthropic", "openai", "azure-openai", "ollama"]),
  apiKey: z.string().optional(),
  endpointUrl: z.string().optional(),
  modelName: z.string().min(1),
});

export const projectIdBodySchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

export const saveCategoriesSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        sampleComments: z.unknown().optional(),
        isFallback: z.boolean().optional(),
      })
    )
    .min(1, "At least one category is required"),
});

export const updateCategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const createNoiseFilterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  filterKeywords: z.array(z.string().min(1)).min(1, "At least one keyword is required"),
  excludeFromNps: z.boolean().optional(),
});

export const saveStructureSchema = z.object({
  includedColumns: z.array(z.string()),
  excludedColumns: z.array(z.string()),
});

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Parses request body with a Zod schema.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false, error: "Invalid JSON body" };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: messages };
  }

  return { success: true, data: result.data };
}
