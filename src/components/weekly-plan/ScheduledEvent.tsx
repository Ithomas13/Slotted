"use client";

import { X } from "lucide-react";
import type { ScheduledSlot } from "@/types/index";
import { cn } from "@/lib/utils";

const importanceBadge: Record<string, string> = {
  CRITICAL: "bg-red-200 text-red-800",
  HIGH: "bg-orange-200 text-orange-800",
  MEDIUM: "bg-yellow-200 text-yellow-800",
  LOW: "bg-green-200 text-green-800",
};

interface ScheduledEventProps {
  slot: ScheduledSlot;
  onDelete: () => void;
}

export function ScheduledEvent({ slot, onDelete }: ScheduledEventProps) {
  return (
    <div className="h-full flex flex-col text-xs p-1 overflow-hidden relative group">
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium truncate">{slot.task.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <span className={cn("mt-auto self-start px-1 rounded-full text-[10px]", importanceBadge[slot.task.importance])}>
        {slot.task.importance}
      </span>
    </div>
  );
}
