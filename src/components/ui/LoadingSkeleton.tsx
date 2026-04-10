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
          className="h-4 bg-nexus-border rounded"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5 animate-pulse">
      <div className="h-3 w-24 bg-nexus-border rounded mb-3" />
      <div className="h-8 w-32 bg-nexus-border rounded mb-2" />
      <div className="h-3 w-20 bg-nexus-border rounded" />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-80' }: { height?: string }) {
  return (
    <div className={`bg-nexus-card border border-nexus-border rounded-lg p-5 animate-pulse ${height}`}>
      <div className="h-4 w-48 bg-nexus-border rounded mb-6" />
      <div className="flex items-end gap-2 h-3/4">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-nexus-border rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}
