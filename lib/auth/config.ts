import type { NextAuthConfig } from "next-auth";

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
        nextUrl.pathname.startsWith("/api/auth");

      if (isAuthPage) return true;

      const authRequired = process.env.AUTH_REQUIRED !== "false";
      if (!authRequired) return true;

      return isLoggedIn;
    },
  },
};
