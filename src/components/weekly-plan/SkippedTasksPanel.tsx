"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ScheduledSlot } from "@/types/index";
import { cn } from "@/lib/utils";

const importanceBadge: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-600",
};

interface SkippedTasksPanelProps {
  slots: ScheduledSlot[];
}

export function SkippedTasksPanel({ slots }: SkippedTasksPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border rounded-lg bg-card h-fit">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium"
      >
        <span>Skipped ({slots.length})</span>
        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {!collapsed && (
        <ul className="divide-y">
          {slots.map((slot) => (
            <li key={slot.id} className="p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate flex-1">{slot.task.name}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", importanceBadge[slot.task.importance])}>
                  {slot.task.importance}
                </span>
              </div>
              {slot.skipReason && (
                <p className="text-xs text-muted-foreground">{slot.skipReason}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
