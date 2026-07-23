import { z } from "zod";

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const scheduledItemSchema = z.object({
  taskId: z.string().min(1),
  slotStart: isoDateTimeSchema,
  slotEnd: isoDateTimeSchema,
}).refine(
  (item) => new Date(item.slotEnd).getTime() > new Date(item.slotStart).getTime(),
  {
    message: "slotEnd must be after slotStart",
    path: ["slotEnd"],
  }
);

export const skippedItemSchema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(1),
  suggestion: z.string().min(1),
});

export const aiOutputSchema = z.object({
  scheduled: z.array(scheduledItemSchema),
  skipped: z.array(skippedItemSchema),
});

export type AIOutput = z.infer<typeof aiOutputSchema>;
export type ScheduledItem = z.infer<typeof scheduledItemSchema>;
export type SkippedItem = z.infer<typeof skippedItemSchema>;

export function parseAIOutput(raw: string): AIOutput {
  const json = JSON.parse(raw);
  return aiOutputSchema.parse(json);
}
