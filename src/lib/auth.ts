import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";

// Single-user auth for DrePark
const ADMIN_PASSWORD_HASH_PROMISE = hash(
  process.env.ADMIN_PASSWORD || "drepark2026",
  12
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "DrePark",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;

        const adminHash = await ADMIN_PASSWORD_HASH_PROMISE;
        const valid = await compare(
          credentials.password as string,
          adminHash
        );

        if (valid) {
          return {
            id: "1",
            name: "Andrei",
            email: "andrei@drepark.app",
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
});
