import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the register schema (same as in the API route)
const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// Test the profile update schema (same as in the API route)
const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Carlos",
      email: "carlos@example.com",
      password: "securepassword123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "carlos@example.com",
      password: "securepassword123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Carlos",
      email: "not-an-email",
      password: "securepassword123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Carlos",
      email: "carlos@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 characters", () => {
    const result = registerSchema.safeParse({
      name: "Carlos",
      email: "carlos@example.com",
      password: "x".repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(registerSchema.safeParse({}).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Carlos" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "test@test.com" }).success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts name update", () => {
    const result = updateProfileSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts password change", () => {
    const result = updateProfileSchema.safeParse({
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects new password shorter than 8 chars", () => {
    const result = updateProfileSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = updateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("auth middleware logic", () => {
  // Test the authorization logic from authConfig.callbacks.authorized
  function isAuthorized(opts: {
    isLoggedIn: boolean;
    pathname: string;
    authRequired: boolean;
  }): boolean {
    const { isLoggedIn, pathname, authRequired } = opts;
    const isAuthPage =
      pathname.startsWith("/login") || pathname.startsWith("/api/auth");

    if (isAuthPage) return true;
    if (!authRequired) return true;
    return isLoggedIn;
  }

  it("allows access to login page regardless of auth state", () => {
    expect(isAuthorized({ isLoggedIn: false, pathname: "/login", authRequired: true })).toBe(true);
  });

  it("allows access to auth API routes", () => {
    expect(isAuthorized({ isLoggedIn: false, pathname: "/api/auth/callback/github", authRequired: true })).toBe(true);
  });

  it("allows all routes when auth is not required", () => {
    expect(isAuthorized({ isLoggedIn: false, pathname: "/", authRequired: false })).toBe(true);
    expect(isAuthorized({ isLoggedIn: false, pathname: "/project/123/dashboard", authRequired: false })).toBe(true);
  });

  it("blocks unauthenticated access to protected routes when auth required", () => {
    expect(isAuthorized({ isLoggedIn: false, pathname: "/", authRequired: true })).toBe(false);
    expect(isAuthorized({ isLoggedIn: false, pathname: "/project/123/dashboard", authRequired: true })).toBe(false);
  });

  it("allows authenticated access to protected routes", () => {
    expect(isAuthorized({ isLoggedIn: true, pathname: "/", authRequired: true })).toBe(true);
    expect(isAuthorized({ isLoggedIn: true, pathname: "/project/123/dashboard", authRequired: true })).toBe(true);
  });
});
