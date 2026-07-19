import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}

/**
 * Small confirmation dialog for destructive actions such as deleting an image.
 * Uses the shared Modal component so the visual language stays consistent.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            tone === 'danger'
              ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
              : 'bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-6">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
