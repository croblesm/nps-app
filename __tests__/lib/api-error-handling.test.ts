import { describe, it, expect } from "vitest";
import { parseBody, createProjectSchema, saveLlmConfigSchema, projectIdBodySchema } from "@/lib/api/schemas";

// Helper to create a mock Request with a JSON body
function mockRequest(body: unknown): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper to create a mock Request with invalid JSON
function mockBadJsonRequest(): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not valid json {{{",
  });
}

// Helper to create a mock Request with empty body
function mockEmptyRequest(): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "",
  });
}

describe("parseBody error handling", () => {
  it("returns error for invalid JSON", async () => {
    const result = await parseBody(mockBadJsonRequest(), createProjectSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid JSON body");
    }
  });

  it("returns error for empty body", async () => {
    const result = await parseBody(mockEmptyRequest(), createProjectSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid JSON body");
    }
  });

  it("returns error for missing required fields", async () => {
    const result = await parseBody(mockRequest({}), createProjectSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("returns error for wrong types", async () => {
    const result = await parseBody(
      mockRequest({ name: 12345 }),
      createProjectSchema
    );
    expect(result.success).toBe(false);
  });

  it("returns data for valid input", async () => {
    const result = await parseBody(
      mockRequest({ name: "Test Project" }),
      createProjectSchema
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test Project");
    }
  });

  it("validates LLM config rejects invalid provider", async () => {
    const result = await parseBody(
      mockRequest({ provider: "invalid", modelName: "test" }),
      saveLlmConfigSchema
    );
    expect(result.success).toBe(false);
  });

  it("validates LLM config accepts valid ollama config", async () => {
    const result = await parseBody(
      mockRequest({ provider: "ollama", modelName: "mistral:latest" }),
      saveLlmConfigSchema
    );
    expect(result.success).toBe(true);
  });

  it("validates projectId rejects non-UUID", async () => {
    const result = await parseBody(
      mockRequest({ projectId: "not-a-uuid" }),
      projectIdBodySchema
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid project ID");
    }
  });

  it("validates projectId accepts valid UUID", async () => {
    const result = await parseBody(
      mockRequest({ projectId: "550e8400-e29b-41d4-a716-446655440000" }),
      projectIdBodySchema
    );
    expect(result.success).toBe(true);
  });

  it("handles null body gracefully", async () => {
    const req = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseBody(req, createProjectSchema);
    expect(result.success).toBe(false);
  });
});
