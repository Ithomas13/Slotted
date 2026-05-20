"use client";

import { startOfWeek } from "date-fns";
import { useSchedule } from "@/hooks/useSchedule";
import { useNotes } from "@/hooks/useNotes";
import { WeeklyPlanCalendar } from "./WeeklyPlanCalendar";
import { SkippedTasksPanel } from "./SkippedTasksPanel";
import { RegenerateButton } from "./RegenerateButton";
import { StaleBanner } from "./StaleBanner";

function getWeekStart() {
  return startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
}

export function WeeklyPlanView() {
  const weekStart = getWeekStart();
  const { data: plan, isLoading } = useSchedule(weekStart);
  const { data: notes } = useNotes();

  const isStale = (() => {
    if (!plan || !notes) return false;
    const planTime = new Date(plan.generatedAt).getTime();
    return notes.some((n) =>
      n.tasks.some((t) => new Date(t.updatedAt).getTime() > planTime)
    );
  })();

  const scheduledSlots = plan?.slots.filter((s) => !s.skipped) ?? [];
  const skippedSlots = plan?.slots.filter((s) => s.skipped) ?? [];

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      <div className="flex items-center gap-3">
        <RegenerateButton weekStart={weekStart} />
      </div>

      {isStale && <StaleBanner weekStart={weekStart} />}

      {isLoading ? (
        <div className="flex-1 bg-muted rounded-lg animate-pulse" />
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <WeeklyPlanCalendar slots={scheduledSlots} weekStart={weekStart} />
          </div>
          {skippedSlots.length > 0 && (
            <div className="w-72 shrink-0">
              <SkippedTasksPanel slots={skippedSlots} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
