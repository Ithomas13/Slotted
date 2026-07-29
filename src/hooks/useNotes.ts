import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assertOk, readJson } from "@/lib/api/client";
import type { Note } from "@/types/index";
import type { CreateNoteBody, UpdateNoteBody } from "@/types/api";

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  return readJson<Note[]>(res, "Failed to fetch notes");
}

export function useNotes() {
  return useQuery({ queryKey: ["notes"], queryFn: fetchNotes });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateNoteBody) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return readJson<Note>(res, "Failed to create note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateNoteBody & { id: string }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return readJson<Note>(res, "Failed to update note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      await assertOk(res, "Failed to delete note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
