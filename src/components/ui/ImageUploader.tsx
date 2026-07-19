import { useRef, useState } from 'react';
import { Camera, Upload, RefreshCw, Trash2, Loader2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { post, del as apiDel, resolveImageUrl } from '@/lib/api';
import {
  ACCEPTED_ACCEPT_ATTR,
  processImage,
  validateImageFile,
  type ProcessOptions,
} from '@/utils/image';

interface UploadResponse {
  id: string;
  url: string;
  mime: string;
  sizeBytes: number;
}

interface ImageUploaderProps {
  /** Current image (relative or absolute URL). */
  value?: string | null;
  /** Called with the new URL after a successful upload, or null on remove. */
  onChange: (url: string | null) => void | Promise<void>;
  /** Visual variant. */
  variant?: 'avatar' | 'card' | 'tile';
  /** Fallback content shown when there is no image (initials, icon, etc.). */
  placeholder?: React.ReactNode;
  /** Label shown next to buttons in card variant. */
  label?: string;
  /** Optional confirmation copy overrides. */
  removeTitle?: string;
  removeMessage?: string;
  /** Client-side compression config. */
  processOptions?: ProcessOptions;
  /** Disable all controls. */
  disabled?: boolean;
  /** Extra class for the outer wrapper. */
  className?: string;
  /** When true, request server to also delete the previous file from storage. */
  cleanupPrevious?: boolean;
}

/**
 * Drop-in image manager providing Upload, Update (replace) and Remove flows
 * with a confirmation prompt before deletion. Handles client-side compression,
 * secure JPEG/PNG/WebP validation, drag-and-drop, and inline previews.
 */
export function ImageUploader({
  value,
  onChange,
  variant = 'card',
  placeholder,
  label,
  removeTitle = 'Remove this image?',
  removeMessage = 'The image will be permanently deleted. This cannot be undone.',
  processOptions,
  disabled,
  className = '',
  cleanupPrevious = true,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'removing'>('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const hasImage = Boolean(value);
  const displayUrl = resolveImageUrl(value || '');

  const pickFile = () => {
    if (disabled || busy !== 'idle') return;
    inputRef.current?.click();
  };

  async function handleFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    let newUploadUrl: string | null = null;
    try {
      setBusy('uploading');
      const previous = value || null;

      const processed = await processImage(file, processOptions);
      const uploaded = await post<UploadResponse>('/api/uploads', { dataUrl: processed.dataUrl });
      newUploadUrl = uploaded.url;

      await onChange(uploaded.url);
      newUploadUrl = null; // The owning profile/product/gallery now references it.

      // Best-effort cleanup of the previous owned upload (local or Cloudinary).
      if (cleanupPrevious && previous) {
        try { await apiDel('/api/uploads', { url: previous }); } catch { /* ignore */ }
      }

      toast.success(hasImage ? 'Image updated' : 'Image uploaded');
    } catch (err) {
      // If saving the returned URL failed, remove the otherwise orphaned upload.
      if (newUploadUrl) {
        try { await apiDel('/api/uploads', { url: newUploadUrl }); } catch { /* ignore */ }
      }
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setBusy('idle');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || busy !== 'idle') return;
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  const askRemove = () => {
    if (disabled || busy !== 'idle' || !hasImage) return;
    setConfirmOpen(true);
  };

  const doRemove = async () => {
    try {
      setBusy('removing');
      const previous = value || null;
      await onChange(null);
      if (cleanupPrevious && previous) {
        try { await apiDel('/api/uploads', { url: previous }); } catch { /* ignore */ }
      }
      toast.success('Image removed');
      setConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not remove image';
      toast.error(msg);
    } finally {
      setBusy('idle');
    }
  };

  // ------------------------------------------------------------------- AVATAR
  if (variant === 'avatar') {
    return (
      <div className={`relative inline-block ${className}`}>
        <div
          className="h-24 w-24 rounded-2xl overflow-hidden gradient-primary flex items-center justify-center text-white text-3xl font-bold shadow-soft"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {hasImage ? (
            <img src={displayUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            placeholder ?? <Camera className="h-8 w-8" />
          )}
          {busy !== 'idle' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
          {dragOver && (
            <div className="absolute inset-0 rounded-2xl ring-4 ring-primary-400/70" />
          )}
        </div>

        <div className="absolute -bottom-2 -right-2 flex gap-1">
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled || busy !== 'idle'}
            title={hasImage ? 'Update picture' : 'Upload picture'}
            className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 shadow-float flex items-center justify-center text-gray-700 dark:text-zinc-200 hover:text-primary-600 disabled:opacity-50"
          >
            {hasImage ? <RefreshCw className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={askRemove}
              disabled={disabled || busy !== 'idle'}
              title="Remove picture"
              className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 shadow-float flex items-center justify-center text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_ACCEPT_ATTR}
          onChange={onInputChange}
          className="hidden"
        />

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={doRemove}
          title={removeTitle}
          message={removeMessage}
          confirmLabel="Remove"
          loading={busy === 'removing'}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------- TILE
  if (variant === 'tile') {
    return (
      <>
        <div
          className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 group ${className}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {hasImage ? (
            <img src={displayUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <button
              type="button"
              onClick={pickFile}
              disabled={disabled || busy !== 'idle'}
              className={`h-full w-full flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 border-2 border-dashed ${
                dragOver ? 'border-primary-500 bg-primary-50/40' : 'border-gray-200 dark:border-zinc-700'
              } rounded-xl transition-colors`}
            >
              <ImagePlus className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Add Photo</span>
            </button>
          )}

          {hasImage && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-1">
              <button
                type="button"
                onClick={pickFile}
                disabled={disabled || busy !== 'idle'}
                title="Replace"
                className="h-8 w-8 rounded-lg bg-white/95 dark:bg-zinc-900/95 shadow-soft flex items-center justify-center hover:text-primary-600"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={askRemove}
                disabled={disabled || busy !== 'idle'}
                title="Remove"
                className="h-8 w-8 rounded-lg bg-white/95 dark:bg-zinc-900/95 shadow-soft flex items-center justify-center text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {busy !== 'idle' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_ACCEPT_ATTR}
          onChange={onInputChange}
          className="hidden"
        />

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={doRemove}
          title={removeTitle}
          message={removeMessage}
          confirmLabel="Remove"
          loading={busy === 'removing'}
        />
      </>
    );
  }

  // --------------------------------------------------------------------- CARD
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-2xl overflow-hidden border-2 border-dashed transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50/40'
            : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900'
        }`}
      >
        {hasImage ? (
          <div className="relative">
            <img src={displayUrl} alt="" className="w-full h-56 object-cover" />
            {busy !== 'idle' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled || busy !== 'idle'}
            className="w-full h-56 flex flex-col items-center justify-center text-gray-500 hover:text-primary-600"
          >
            {busy === 'uploading' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Click or drop to upload</span>
                <span className="text-xs text-gray-400 mt-1">JPEG, PNG or WebP · up to 10 MB</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={hasImage ? 'outline' : 'primary'}
          size="sm"
          onClick={pickFile}
          disabled={disabled || busy !== 'idle'}
        >
          {hasImage ? (
            <>
              <RefreshCw className="h-4 w-4" /> Update
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload
            </>
          )}
        </Button>
        {hasImage && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={askRemove}
            disabled={disabled || busy !== 'idle'}
          >
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ACCEPT_ATTR}
        onChange={onInputChange}
        className="hidden"
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doRemove}
        title={removeTitle}
        message={removeMessage}
        confirmLabel="Remove"
        loading={busy === 'removing'}
      />
    </div>
  );
}
