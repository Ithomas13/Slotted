import type { Note, Task, ScheduledPlan, ScheduledSlot } from "./index";

export interface CreateNoteBody {
  title: string;
  description?: string;
  color?: string;
}

export interface UpdateNoteBody {
  title?: string;
  description?: string;
  color?: string;
  position?: number;
}

export interface CreateTaskBody {
  name: string;
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  durationMins: number;
  timeWindows?: Array<{ start: string; end: string; label?: string }>;
  repeatRule?: "NONE" | "DAILY" | "WEEKLY";
}

export interface UpdateTaskBody {
  name?: string;
  importance?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  durationMins?: number;
  timeWindows?: Array<{ start: string; end: string; label?: string }> | null;
  repeatRule?: "NONE" | "DAILY" | "WEEKLY";
  completed?: boolean;
  position?: number;
}

export interface UpdateSlotBody {
  startTime?: string;
  endTime?: string;
  manuallyMoved?: boolean;
}

export interface GenerateScheduleBody {
  weekStart: string;
}

export type NotesResponse = Note[];
export type NoteResponse = Note;
export type TaskResponse = Task;
export type ScheduleResponse = ScheduledPlan | null;
export type SlotResponse = ScheduledSlot;
