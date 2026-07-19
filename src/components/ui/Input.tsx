import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { classNames } from '@/utils/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, error, ...props }, ref) => (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</span>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={classNames(
            'w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30',
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-red-600 dark:text-red-400">{error}</span>}
    </label>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</span>}
      <textarea
        ref={ref}
        className={classNames(
          'w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          className
        )}
        {...props}
      />
    </label>
  )
);
Textarea.displayName = 'Textarea';
