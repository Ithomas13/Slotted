import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduledPlan } from "@/types/index";
import type { UpdateSlotBody } from "@/types/api";
import { startOfWeek } from "date-fns";

function getWeekStart(date: Date = new Date()): string {
  return startOfWeek(date, { weekStartsOn: 1 }).toISOString();
}

async function fetchSchedule(weekStart: string): Promise<ScheduledPlan | null> {
  const res = await fetch(`/api/schedule?weekStart=${encodeURIComponent(weekStart)}`);
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
}

export function useSchedule(weekStart?: string) {
  const ws = weekStart ?? getWeekStart();
  return useQuery({
    queryKey: ["schedule", ws],
    queryFn: () => fetchSchedule(ws),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useGenerateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (weekStart: string) => {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      if (!res.ok) throw new Error("Failed to generate schedule");
      return res.json() as Promise<ScheduledPlan>;
    },
    onSuccess: (_data, weekStart) => {
      qc.invalidateQueries({ queryKey: ["schedule", weekStart] });
    },
  });
}

export function useUpdateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateSlotBody & { id: string }) => {
      const res = await fetch(`/api/schedule/slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update slot");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });
}

export function useDeleteSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/schedule/slots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete slot");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });
}

export { getWeekStart };
