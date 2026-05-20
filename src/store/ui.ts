import { create } from "zustand";

interface UIState {
  openNoteId: string | null;
  isDragging: boolean;
  setOpenNoteId: (id: string | null) => void;
  setIsDragging: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  openNoteId: null,
  isDragging: false,
  setOpenNoteId: (id) => set({ openNoteId: id }),
  setIsDragging: (v) => set({ isDragging: v }),
}));
