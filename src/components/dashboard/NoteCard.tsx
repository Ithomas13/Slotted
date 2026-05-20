"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { useDeleteNote } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/index";

const importanceColors: Record<string, string> = {
  CRITICAL: "text-red-600 font-semibold",
  HIGH: "text-orange-500 font-medium",
  MEDIUM: "text-yellow-600",
  LOW: "text-gray-500",
};

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const deleteNote = useDeleteNote();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: note.color ?? undefined }}
      className={cn(
        "border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow bg-card relative group",
        isDragging && "shadow-xl"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          deleteNote.mutate(note.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <h3 className="font-semibold text-sm mb-1 truncate pr-6">{note.title}</h3>
      {note.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{note.description}</p>
      )}

      <ul className="space-y-1 mt-2">
        {note.tasks.slice(0, 4).map((task) => (
          <li key={task.id} className="flex items-center gap-1 text-xs">
            <span className={cn("truncate", importanceColors[task.importance])}>
              {task.name}
            </span>
            <span className="text-muted-foreground shrink-0">({task.durationMins}m)</span>
          </li>
        ))}
        {note.tasks.length > 4 && (
          <li className="text-xs text-muted-foreground">+{note.tasks.length - 4} more</li>
        )}
      </ul>
    </div>
  );
}
