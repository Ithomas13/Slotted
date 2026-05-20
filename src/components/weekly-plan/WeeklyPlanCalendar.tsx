"use client";

import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useUpdateSlot, useDeleteSlot } from "@/hooks/useSchedule";
import { ScheduledEvent } from "./ScheduledEvent";
import type { ScheduledSlot } from "@/types/index";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledSlot;
}

interface WeeklyPlanCalendarProps {
  slots: ScheduledSlot[];
  weekStart: string;
}

const importanceColors: Record<string, string> = {
  CRITICAL: "#fecaca",
  HIGH: "#fed7aa",
  MEDIUM: "#fef08a",
  LOW: "#d1fae5",
};

export function WeeklyPlanCalendar({ slots, weekStart }: WeeklyPlanCalendarProps) {
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();

  const events: CalendarEvent[] = useMemo(
    () =>
      slots.map((s) => ({
        id: s.id,
        title: s.task.name,
        start: new Date(s.startTime),
        end: new Date(s.endTime),
        resource: s,
      })),
    [slots]
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      updateSlot.mutate({
        id: event.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        manuallyMoved: true,
      });
    },
    [updateSlot]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      updateSlot.mutate({
        id: event.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        manuallyMoved: true,
      });
    },
    [updateSlot]
  );

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: importanceColors[event.resource.task.importance] ?? "#e5e7eb",
        color: "#1f2937",
        border: "none",
        borderRadius: "4px",
      },
    }),
    []
  );

  const components = useMemo(
    () => ({
      event: ({ event }: { event: CalendarEvent }) => (
        <ScheduledEvent
          slot={event.resource}
          onDelete={() => deleteSlot.mutate(event.id)}
        />
      ),
    }),
    [deleteSlot]
  );

  return (
    <DnDCalendar
      localizer={localizer}
      events={events}
      defaultView={Views.WEEK}
      defaultDate={new Date(weekStart)}
      style={{ height: "100%", minHeight: 500 }}
      onEventDrop={handleEventDrop as never}
      onEventResize={handleEventResize as never}
      resizable
      eventPropGetter={eventStyleGetter as never}
      components={components as never}
    />
  );
}
