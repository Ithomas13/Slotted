export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMins: number;
}
