import { z } from "zod";

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const updateSlotSchema = z.object({
  startTime: isoDateTimeSchema.optional(),
  endTime: isoDateTimeSchema.optional(),
  manuallyMoved: z.boolean().optional(),
});

export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;

export function resolveSlotUpdate(
  input: UpdateSlotInput,
  current: { startTime: Date; endTime: Date }
) {
  const nextStart = input.startTime ? new Date(input.startTime) : current.startTime;
  const nextEnd = input.endTime ? new Date(input.endTime) : current.endTime;

  if ((input.startTime !== undefined || input.endTime !== undefined) && nextEnd <= nextStart) {
    return null;
  }

  return {
    ...(input.startTime !== undefined && { startTime: nextStart }),
    ...(input.endTime !== undefined && { endTime: nextEnd }),
    ...(input.manuallyMoved !== undefined && { manuallyMoved: input.manuallyMoved }),
  };
}
