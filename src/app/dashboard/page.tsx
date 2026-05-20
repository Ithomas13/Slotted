import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NoteGrid } from "@/components/dashboard/NoteGrid";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Notes</h1>
      <NoteGrid />
    </div>
  );
}
