function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--rule-light)] ${className}`}
    />
  );
}

function DayColumnSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* Day header */}
      <SkeletonLine className="h-5 w-24" />
      {/* Chain card stubs */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-[var(--rule)] p-3"
        >
          <div className="flex items-center gap-2">
            <SkeletonLine className="h-4 flex-1" />
            <SkeletonLine className="h-4 w-14" />
          </div>
          {[0, 1].map((j) => (
            <div key={j} className="flex items-center gap-2">
              <SkeletonLine className="h-3 w-3" />
              <SkeletonLine className="h-3 flex-1" />
              <SkeletonLine className="h-3 w-12" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function WeekViewSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Week navigation bar */}
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-8" />
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-8 w-8" />
      </div>
      {/* 7-column grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <DayColumnSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
