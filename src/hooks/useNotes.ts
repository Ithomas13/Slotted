import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Note } from "@/types/index";
import type { CreateNoteBody, UpdateNoteBody } from "@/types/api";

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
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
      if (!res.ok) throw new Error("Failed to create note");
      return res.json() as Promise<Note>;
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
      if (!res.ok) throw new Error("Failed to update note");
      return res.json() as Promise<Note>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
