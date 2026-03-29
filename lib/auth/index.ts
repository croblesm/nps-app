import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "./config";
import { getDb } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== "credentials") {
        const db = await getDb();
        const { User } = await import("@/lib/db/entities/User");
        const repo = db.getRepository(User);
        const email = user.email?.toLowerCase();
        if (!email) return true;

        let existing = await repo.findOneBy({ email });
        if (existing) {
          // Update profile on subsequent sign-ins
          existing.name = user.name || existing.name;
          existing.image = user.image || existing.image;
          existing.provider = existing.provider || account.provider;
          existing.providerAccountId = existing.providerAccountId || account.providerAccountId;
          existing.updatedAt = new Date();
          await repo.save(existing);
          user.id = existing.id;
        } else {
          // Create new user on first OAuth sign-in
          const newUser = repo.create({
            name: user.name || null,
            email,
            image: user.image || null,
            provider: account.provider,
            providerAccountId: account.providerAccountId || null,
          });
          const saved = await repo.save(newUser);
          user.id = saved.id;
        }
      }
      return true;
    },
  },
  providers: [
    GitHub,
    Google,
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const db = await getDb();
        const { User } = await import("@/lib/db/entities/User");
        const user = await db
          .getRepository(User)
          .findOneBy({ email: email.toLowerCase() });

        if (!user || !user.password) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
});
