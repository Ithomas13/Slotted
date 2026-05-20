import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WeeklyPlanView } from "@/components/weekly-plan/WeeklyPlanView";

export default async function WeeklyPlanPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">Weekly Plan</h1>
      <WeeklyPlanView />
    </div>
  );
}
