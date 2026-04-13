function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--rule-light)] ${className}`}
    />
  );
}

export function DayViewSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-8" />
        <SkeletonLine className="h-6 w-40" />
        <SkeletonLine className="h-8 w-8" />
      </div>
      {/* Chain cards */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="space-y-3 rounded-lg border border-[var(--rule)] p-4"
        >
          <div className="flex items-center gap-2">
            <SkeletonLine className="h-4 flex-1" />
            <SkeletonLine className="h-5 w-20" />
          </div>
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex items-center gap-2">
              <SkeletonLine className="h-4 w-4" />
              <SkeletonLine className="h-4 flex-1" />
              <SkeletonLine className="h-4 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
