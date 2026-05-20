"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useUpdateNote, useDeleteNote } from "@/hooks/useNotes";
import { useCreateTask, useDeleteTask } from "@/hooks/useTasks";
import { TaskForm } from "./TaskForm";
import type { Note } from "@/types/index";
import { cn } from "@/lib/utils";

const importanceBadge: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-600",
};

interface NoteDialogProps {
  note: Note;
  onClose: () => void;
}

export function NoteDialog({ note, onClose }: NoteDialogProps) {
  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description ?? "");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createTask = useCreateTask(note.id);
  const deleteTask = useDeleteTask();

  const handleSave = () => {
    updateNote.mutate({ id: note.id, title, description: description || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{ backgroundColor: note.color ?? undefined }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-semibold text-lg bg-transparent focus:outline-none flex-1"
          />
          <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            rows={3}
            className="w-full bg-transparent text-sm focus:outline-none resize-none text-muted-foreground"
          />

          <div>
            <h4 className="text-sm font-medium mb-2">Tasks</h4>
            <ul className="space-y-2">
              {note.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 text-sm p-2 rounded-md bg-background/50"
                >
                  <span className="flex-1 truncate">{task.name}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", importanceBadge[task.importance])}>
                    {task.importance}
                  </span>
                  <span className="text-xs text-muted-foreground">{task.durationMins}m</span>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>

            {showTaskForm ? (
              <TaskForm
                noteId={note.id}
                onSuccess={() => setShowTaskForm(false)}
                onCancel={() => setShowTaskForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowTaskForm(true)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                + Add task
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={() => { deleteNote.mutate(note.id); onClose(); }}
            className="text-sm text-destructive hover:underline"
          >
            Delete note
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
