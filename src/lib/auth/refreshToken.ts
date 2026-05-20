import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

interface RefreshedTokens {
  accessToken: string;
  expiresAt: Date;
}

export async function refreshGoogleToken(userId: string): Promise<RefreshedTokens> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.googleRefreshToken) throw new Error("No refresh token stored");

  const refreshToken = decrypt(user.googleRefreshToken);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) throw new Error("Failed to refresh Google token");

  const data = await response.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: encrypt(data.access_token),
      googleTokenExpiry: expiresAt,
    },
  });

  return { accessToken: data.access_token, expiresAt };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.googleAccessToken) throw new Error("No access token stored");

  const isExpired = user.googleTokenExpiry
    ? user.googleTokenExpiry.getTime() < Date.now() + 60_000
    : false;

  if (isExpired) {
    const refreshed = await refreshGoogleToken(userId);
    return refreshed.accessToken;
  }

  return decrypt(user.googleAccessToken);
}
