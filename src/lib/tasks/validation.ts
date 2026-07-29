import { z } from "zod";

const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time");

export const timeWindowSchema = z
  .object({
    start: timeOfDaySchema,
    end: timeOfDaySchema,
    label: z.string().optional(),
  })
  .refine((window) => window.end > window.start, {
    message: "End time must be after start time",
    path: ["end"],
  });

export const createTaskSchema = z.object({
  name: z.string().min(1, "Name required"),
  importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  durationMins: z.number().int().min(1),
  timeWindows: z.array(timeWindowSchema).optional(),
  repeatRule: z.enum(["NONE", "DAILY", "WEEKLY"]).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  timeWindows: z.array(timeWindowSchema).nullable().optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
