"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useCreateNote } from "@/hooks/useNotes";
import { useUIStore } from "@/store/ui";

const NOTE_COLORS = [
  { label: "Default", value: null },
  { label: "Red", value: "#fecaca" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
];

export function AddNoteButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const createNote = useCreateNote();
  const { setOpenNoteId } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const note = await createNote.mutateAsync({ title: title.trim(), color: color ?? undefined });
    setOpen(false);
    setTitle("");
    setColor(null);
    setOpenNoteId(note.id);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        aria-label="Add note"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-lg p-6 w-80 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New Note</h2>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setColor(value)}
                    className={`h-6 w-6 rounded-full border-2 ${color === value ? "border-primary" : "border-transparent"}`}
                    style={{ backgroundColor: value ?? "#e5e7eb" }}
                    title={label}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || createNote.isPending}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium disabled:opacity-50"
            >
              {createNote.isPending ? "Creating..." : "Create Note"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
