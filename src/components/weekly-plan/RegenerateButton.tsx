"use client";

import { RefreshCw } from "lucide-react";
import { useGenerateSchedule } from "@/hooks/useSchedule";

interface RegenerateButtonProps {
  weekStart: string;
}

export function RegenerateButton({ weekStart }: RegenerateButtonProps) {
  const generate = useGenerateSchedule();

  return (
    <button
      onClick={() => generate.mutate(weekStart)}
      disabled={generate.isPending}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
    >
      <RefreshCw className={`h-4 w-4 ${generate.isPending ? "animate-spin" : ""}`} />
      {generate.isPending ? "Generating..." : "Generate Schedule"}
    </button>
  );
}
