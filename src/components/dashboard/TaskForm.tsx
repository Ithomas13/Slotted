"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import type { Task } from "@/types/index";

const taskSchema = z.object({
  name: z.string().min(1, "Name required"),
  importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  durationMins: z.number().int().min(1),
  repeatRule: z.enum(["NONE", "DAILY", "WEEKLY"]),
  timeWindows: z.array(
    z.object({ start: z.string(), end: z.string(), label: z.string().optional() })
  ),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const DURATION_PRESETS = [15, 30, 60, 90, 120];

interface TaskFormProps {
  noteId?: string;
  existingTask?: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaskForm({ noteId, existingTask, onSuccess, onCancel }: TaskFormProps) {
  const createTask = noteId ? useCreateTask(noteId) : null;
  const updateTask = useUpdateTask();

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: existingTask
      ? {
          name: existingTask.name,
          importance: existingTask.importance,
          durationMins: existingTask.durationMins,
          repeatRule: existingTask.repeatRule,
          timeWindows: (existingTask.timeWindows as TaskFormValues["timeWindows"]) ?? [],
        }
      : {
          name: "",
          importance: "MEDIUM",
          durationMins: 30,
          repeatRule: "NONE",
          timeWindows: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "timeWindows" });
  const durationMins = watch("durationMins");

  const onSubmit = async (data: TaskFormValues) => {
    if (existingTask) {
      await updateTask.mutateAsync({ id: existingTask.id, ...data });
    } else if (createTask) {
      await createTask.mutateAsync(data);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 p-3 border rounded-lg space-y-3 bg-background/60 text-sm">
      <div>
        <input
          {...register("name")}
          placeholder="Task name"
          className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Importance</label>
          <select {...register("importance")} className="w-full border rounded px-2 py-1 text-sm mt-0.5">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Repeat</label>
          <select {...register("repeatRule")} className="w-full border rounded px-2 py-1 text-sm mt-0.5">
            <option value="NONE">None</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Duration</label>
        <div className="flex gap-1 mt-0.5 flex-wrap">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setValue("durationMins", d)}
              className={`px-2 py-0.5 rounded text-xs border ${durationMins === d ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >
              {d}m
            </button>
          ))}
          <input
            type="number"
            {...register("durationMins", { valueAsNumber: true })}
            className="w-16 border rounded px-2 py-0.5 text-xs"
            min={1}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Time windows (optional)</label>
          <button
            type="button"
            onClick={() => append({ start: "08:00", end: "20:00", label: "" })}
            className="text-xs text-primary"
          >
            + Add
          </button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-1 mt-1 items-center">
            <input {...register(`timeWindows.${i}.start`)} type="time" className="border rounded px-1 py-0.5 text-xs" />
            <span className="text-xs">–</span>
            <input {...register(`timeWindows.${i}.end`)} type="time" className="border rounded px-1 py-0.5 text-xs" />
            <input {...register(`timeWindows.${i}.label`)} placeholder="label" className="flex-1 border rounded px-1 py-0.5 text-xs" />
            <button type="button" onClick={() => remove(i)} className="text-destructive text-xs">✕</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs border rounded">Cancel</button>
        <button type="submit" className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">
          {existingTask ? "Save" : "Add Task"}
        </button>
      </div>
    </form>
  );
}
