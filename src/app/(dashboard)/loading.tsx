export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-36 rounded-md bg-gray-200 animate-pulse" />
        <div className="h-9 w-36 rounded-md bg-gray-200 animate-pulse" />
      </div>

      {/* Task card skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
