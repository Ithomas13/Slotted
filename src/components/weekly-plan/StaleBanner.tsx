"use client";

import { AlertTriangle } from "lucide-react";
import { useGenerateSchedule } from "@/hooks/useSchedule";

interface StaleBannerProps {
  weekStart: string;
}

export function StaleBanner({ weekStart }: StaleBannerProps) {
  const generate = useGenerateSchedule();

  return (
    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
      <span className="flex-1 text-yellow-800">
        Tasks changed since the last schedule was generated.
      </span>
      <button
        onClick={() => generate.mutate(weekStart)}
        disabled={generate.isPending}
        className="px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium hover:bg-yellow-700 disabled:opacity-50"
      >
        Regenerate
      </button>
    </div>
  );
}
