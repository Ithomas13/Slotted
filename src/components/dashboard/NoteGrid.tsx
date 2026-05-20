"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useNotes, useUpdateNote } from "@/hooks/useNotes";
import { useUIStore } from "@/store/ui";
import { NoteCard } from "./NoteCard";
import { NoteDialog } from "./NoteDialog";
import { AddNoteButton } from "./AddNoteButton";

export function NoteGrid() {
  const { data: notes, isLoading } = useNotes();
  const updateNote = useUpdateNote();
  const { openNoteId, setOpenNoteId } = useUIStore();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !notes) return;

    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);

    reordered.forEach((note, i) => {
      if (note.position !== i) {
        updateNote.mutate({ id: note.id, position: i });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const noteList = notes ?? [];

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={noteList.map((n) => n.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {noteList.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => setOpenNoteId(note.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {openNoteId && (
        <NoteDialog
          note={noteList.find((n) => n.id === openNoteId)!}
          onClose={() => setOpenNoteId(null)}
        />
      )}

      <AddNoteButton />
    </>
  );
}
