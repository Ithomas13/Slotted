import type { CalendarEvent } from "@/types/calendar";
import { createCalendarClient } from "./client";

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const calendar = createCalendarClient(accessToken);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const items = response.data.items ?? [];

  return items
    .filter((item) => item.status !== "cancelled")
    .map((item) => {
      const allDay = !!item.start?.date;
      return {
        id: item.id ?? "",
        summary: item.summary ?? "(No title)",
        start: allDay ? item.start!.date! : item.start!.dateTime!,
        end: allDay ? item.end!.date! : item.end!.dateTime!,
        allDay,
      };
    });
}
