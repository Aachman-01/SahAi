/**
 * Client-side image utilities.
 *
 * We optimise images entirely in the browser before sending them to the
 * backend so uploads stay fast and storage costs stay small:
 *
 *   1. Reject anything that isn't a supported image type.
 *   2. Decode into an off-screen canvas and downscale to a max dimension.
 *   3. Re-encode as JPEG (or WebP for transparent PNGs) with quality control.
 *   4. Return a base64 data URL that the API accepts as `dataUrl`.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB before compression

export interface ProcessOptions {
  /** Maximum width OR height (in px) after resize. Aspect ratio is preserved. */
  maxDimension?: number;
  /** JPEG/WebP quality between 0 and 1. */
  quality?: number;
  /** Force output type. Defaults to image/jpeg (or image/webp if source has alpha). */
  outputType?: 'image/jpeg' | 'image/webp';
}

export interface ProcessedImage {
  dataUrl: string;
  mime: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/** Human-readable validation error for common upload issues. */
export function validateImageFile(file: File): string | null {
  if (!file) return 'No file selected';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Only JPEG, PNG or WebP images are supported.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return `File is too large (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB).`;
  }
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error || new Error('Could not read file'));
    fr.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Invalid image data'));
    img.src = src;
  });
}

/** Compress + resize an image entirely on the client. */
export async function processImage(file: File, opts: ProcessOptions = {}): Promise<ProcessedImage> {
  const err = validateImageFile(file);
  if (err) throw new Error(err);

  const { maxDimension = 1600, quality = 0.85 } = opts;
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  // Compute target dimensions preserving aspect ratio.
  const longest = Math.max(img.width, img.height);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // PNGs may carry transparency — preserve it by keeping webp when possible.
  const outputType: 'image/jpeg' | 'image/webp' =
    opts.outputType ?? (file.type === 'image/png' ? 'image/webp' : 'image/jpeg');

  const outUrl = canvas.toDataURL(outputType, quality);

  // Estimate encoded size from the base64 payload.
  const base64 = outUrl.split(',')[1] || '';
  const sizeBytes = Math.floor((base64.length * 3) / 4);

  return {
    dataUrl: outUrl,
    mime: outputType,
    width: targetW,
    height: targetH,
    sizeBytes,
  };
}
