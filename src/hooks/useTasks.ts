import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assertOk, readJson } from "@/lib/api/client";
import type { Task } from "@/types/index";
import type { CreateTaskBody, UpdateTaskBody } from "@/types/api";

export function useCreateTask(noteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTaskBody) => {
      const res = await fetch(`/api/notes/${noteId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return readJson<Task>(res, "Failed to create task");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateTaskBody & { id: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return readJson<Task>(res, "Failed to update task");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      await assertOk(res, "Failed to delete task");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}
