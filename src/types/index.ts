export type ImportanceLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RepeatRule = "NONE" | "DAILY" | "WEEKLY";

export interface TimeWindow {
  start: string;
  end: string;
  label?: string;
}

export interface Task {
  id: string;
  noteId: string;
  name: string;
  importance: ImportanceLevel;
  durationMins: number;
  timeWindows: TimeWindow[] | null;
  repeatRule: RepeatRule;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  color: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface ScheduledSlot {
  id: string;
  planId: string;
  taskId: string;
  task: Task;
  startTime: string;
  endTime: string;
  manuallyMoved: boolean;
  skipped: boolean;
  skipReason: string | null;
}

export interface ScheduledPlan {
  id: string;
  userId: string;
  weekStart: string;
  generatedAt: string;
  slots: ScheduledSlot[];
}
