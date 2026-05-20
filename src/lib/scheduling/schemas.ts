import { z } from "zod";

export const scheduledItemSchema = z.object({
  taskId: z.string(),
  slotStart: z.string(),
  slotEnd: z.string(),
});

export const skippedItemSchema = z.object({
  taskId: z.string(),
  reason: z.string(),
  suggestion: z.string(),
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
