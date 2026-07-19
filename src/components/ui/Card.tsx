import { type HTMLAttributes } from 'react';
import { classNames } from '@/utils/format';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        'card',
        hover && 'hover:-translate-y-1 hover:shadow-float cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color = 'primary', className }: { children: React.ReactNode; color?: 'primary' | 'secondary' | 'accent' | 'gray' | 'red' | 'green'; className?: string }) {
  const colors = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300',
    accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  };
  return <span className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', colors[color], className)}>{children}</span>;
}
