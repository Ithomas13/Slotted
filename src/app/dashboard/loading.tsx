export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
