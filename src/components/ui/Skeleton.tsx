import { classNames } from '@/utils/format';

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('skeleton h-4 w-full', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
