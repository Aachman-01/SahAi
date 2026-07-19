import { classNames } from '@/utils/format';

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={classNames('h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden', className)}>
      <div className="h-full rounded-full gradient-primary transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
