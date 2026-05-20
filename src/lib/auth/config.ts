import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export type { NextAuthConfig };

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      if (account.access_token && account.refresh_token) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            googleAccessToken: encrypt(account.access_token),
            googleRefreshToken: encrypt(account.refresh_token),
            googleTokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            googleAccessToken: encrypt(account.access_token),
            googleRefreshToken: encrypt(account.refresh_token),
            googleTokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/",
  },
};
