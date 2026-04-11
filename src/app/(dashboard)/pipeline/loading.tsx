export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      {/* Connection status card skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="h-8 w-12 mx-auto rounded bg-gray-200 animate-pulse mb-1" />
                <div className="h-4 w-24 mx-auto rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live event feed skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-12 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="px-6 py-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded bg-gray-50">
              <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 flex-1 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
