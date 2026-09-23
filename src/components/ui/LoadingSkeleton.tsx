'use client';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 bg-[var(--hairline)] rounded-[6px]"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 animate-pulse">
      <div className="h-3 w-24 bg-[var(--hairline)] rounded-[6px] mb-3" />
      <div className="h-8 w-32 bg-[var(--hairline)] rounded-[6px] mb-2" />
      <div className="h-3 w-20 bg-[var(--hairline)] rounded-[6px]" />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-80' }: { height?: string }) {
  return (
    <div className={`rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 animate-pulse ${height}`}>
      <div className="h-4 w-48 bg-[var(--hairline)] rounded-[6px] mb-6" />
      <div className="flex items-end gap-2 h-3/4">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--hairline)] rounded-t"
            // eslint-disable-next-line react-hooks/purity -- decorative skeleton bar heights
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}
