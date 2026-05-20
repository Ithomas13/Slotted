"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
    >
      <LogIn className="h-4 w-4" />
      Sign in with Google
    </button>
  );
}
