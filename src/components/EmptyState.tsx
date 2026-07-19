import { Inbox } from 'lucide-react';

interface Props {
  /** Message to show. Defaults to the standard "No information available". */
  message?: string;
  /** Optional smaller helper line below the message. */
  hint?: string;
  /** Hide the icon for tight/inline spots. */
  icon?: boolean;
  className?: string;
}

/**
 * Shared empty-state block. Rendered inside any data block (list, chart, table)
 * when there is no activity/data yet, so the UI reads "No information available"
 * instead of showing blank or fake placeholder data.
 */
export function EmptyState({ message = 'No information available', hint, icon = true, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`}>
      {icon && (
        <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <Inbox className="h-6 w-6 text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{message}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
