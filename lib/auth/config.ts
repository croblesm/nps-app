import type { NextAuthConfig } from "next-auth";

if (
  process.env.AUTH_REQUIRED === "false" &&
  process.env.NODE_ENV === "production"
) {
  console.warn(
    "\x1b[33m[SECURITY WARNING]\x1b[0m AUTH_REQUIRED=false in production. " +
      "All routes are publicly accessible without authentication."
  );
}

/**
 * Edge-compatible auth config (no Node.js-only imports like TypeORM/bcryptjs).
 * Used by middleware.ts for route protection.
 * The Credentials provider with DB lookup is added in lib/auth/index.ts (Node.js only).
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/api/auth");

      if (isAuthPage) return true;

      const authRequired = process.env.AUTH_REQUIRED !== "false";
      if (!authRequired) return true;

      return isLoggedIn;
    },
  },
};
