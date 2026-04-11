export default function AnalyticsLoading() {
  return (
    <div>
      <div className="h-8 w-40 rounded bg-gray-200 animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overdue big number skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="h-12 w-16 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>

        {/* Chart skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="px-6 py-4">
              <div className="h-[200px] w-full rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}

        {/* Top tags skeleton (full width) */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm md:col-span-2">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
