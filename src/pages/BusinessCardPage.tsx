import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Share2, Save, Palette, LayoutTemplate,
  Type, Eye, EyeOff, Image as ImageIcon, RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProfile, useBusinessCard, useUpdateBusinessCard } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/api';
import { toSVG, upiUri } from '@/lib/qrcode';
import type { BusinessCardConfig, Vendor } from '@/types';
import toast from 'react-hot-toast';

const DEFAULT_CARD: BusinessCardConfig = {
  template: 'modern',
  orientation: 'landscape',
  backgroundColor: '#0f172a',
  accentColor: '#22c55e',
  textColor: '#ffffff',
  fontFamily: 'sans',
  tagline: 'Professional service you can trust',
  showPhoto: true,
  showPhone: true,
  showEmail: true,
  showUpi: true,
  showLocation: true,
  showHours: true,
  showDescription: false,
  showQr: true,
};

const PALETTES = [
  { name: 'Midnight Green', bg: '#0f172a', accent: '#22c55e', text: '#ffffff' },
  { name: 'Royal Gold', bg: '#111111', accent: '#d4af37', text: '#fffdf2' },
  { name: 'Clean Blue', bg: '#f8fafc', accent: '#2563eb', text: '#0f172a' },
  { name: 'Plum', bg: '#2e1065', accent: '#e879f9', text: '#ffffff' },
  { name: 'Terracotta', bg: '#431407', accent: '#fb923c', text: '#fff7ed' },
  { name: 'Ocean', bg: '#083344', accent: '#22d3ee', text: '#ecfeff' },
];

const FONT_LABELS: Record<BusinessCardConfig['fontFamily'], string> = {
  sans: 'Modern Sans',
  serif: 'Elegant Serif',
  mono: 'Technical Mono',
};
const FONT_STACKS: Record<BusinessCardConfig['fontFamily'], string> = {
  sans: 'Arial, sans-serif',
  serif: 'Georgia, serif',
  mono: 'Courier New, monospace',
};

function editableCard(value?: Partial<BusinessCardConfig>): BusinessCardConfig {
  const merged: BusinessCardConfig = { ...DEFAULT_CARD, ...value };
  delete merged.updatedAt;
  return merged;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, family: string, weight = '700') {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 18);
  return size;
}

function truncate(ctx: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (ctx.measureText(value).width <= maxWidth) return value;
  let text = value;
  while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1);
  return `${text}…`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function initials(vendor: Vendor) {
  return (vendor.owner || vendor.name || 'SB')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

async function drawCard(
  canvas: HTMLCanvasElement,
  config: BusinessCardConfig,
  vendor: Vendor,
  email: string,
) {
  const landscape = config.orientation === 'landscape';
  const width = landscape ? 1050 : 700;
  const height = landscape ? 600 : 1050;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const family = FONT_STACKS[config.fontFamily];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = config.backgroundColor;
  roundedRect(ctx, 0, 0, width, height, 32);
  ctx.fill();

  if (config.template === 'modern') {
    ctx.fillStyle = config.accentColor;
    ctx.beginPath();
    if (landscape) {
      ctx.moveTo(0, 0); ctx.lineTo(355, 0); ctx.lineTo(285, height); ctx.lineTo(0, height);
    } else {
      ctx.moveTo(0, 0); ctx.lineTo(width, 0); ctx.lineTo(width, 320); ctx.lineTo(0, 410);
    }
    ctx.closePath(); ctx.fill();
  } else if (config.template === 'classic') {
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 10;
    roundedRect(ctx, 20, 20, width - 40, height - 40, 24);
    ctx.stroke();
    ctx.lineWidth = 2;
    roundedRect(ctx, 38, 38, width - 76, height - 76, 18);
    ctx.stroke();
  } else {
    ctx.fillStyle = config.accentColor;
    ctx.fillRect(0, 0, landscape ? 18 : width, landscape ? height : 18);
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(width - 40, 40, landscape ? 180 : 230, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const photoX = landscape ? 155 : width / 2;
  const photoY = landscape ? 205 : 205;
  const photoRadius = landscape ? 92 : 104;
  const profileImage = resolveImageUrl(vendor.logo || vendor.photo);
  let photoDrawn = false;
  if (config.showPhoto && profileImage) {
    try {
      const image = await loadImage(profileImage);
      ctx.save();
      ctx.beginPath(); ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2); ctx.clip();
      const ratio = Math.max((photoRadius * 2) / image.width, (photoRadius * 2) / image.height);
      const imageWidth = image.width * ratio;
      const imageHeight = image.height * ratio;
      ctx.drawImage(image, photoX - imageWidth / 2, photoY - imageHeight / 2, imageWidth, imageHeight);
      ctx.restore();
      photoDrawn = true;
    } catch { /* initials fallback */ }
  }
  if (config.showPhoto && !photoDrawn) {
    ctx.fillStyle = config.template === 'modern' ? config.backgroundColor : config.accentColor;
    ctx.beginPath(); ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = config.template === 'modern' ? config.textColor : '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${photoRadius * 0.72}px ${family}`;
    ctx.fillText(initials(vendor), photoX, photoY + 3);
  }
  if (config.showPhoto) {
    ctx.strokeStyle = config.textColor;
    ctx.globalAlpha = 0.85; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(photoX, photoY, photoRadius + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const mainX = landscape ? 390 : 60;
  const mainWidth = landscape ? 600 : 580;
  const titleY = landscape ? 105 : 390;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = config.textColor;
  const business = vendor.name || 'Your Business Name';
  const titleSize = fitText(ctx, business, mainWidth, landscape ? 50 : 46, family);
  ctx.font = `700 ${titleSize}px ${family}`;
  ctx.fillText(business, mainX, titleY);

  ctx.fillStyle = config.accentColor;
  ctx.fillRect(mainX, titleY + 20, landscape ? 130 : 170, 7);
  ctx.fillStyle = config.textColor;
  ctx.globalAlpha = 0.92;
  ctx.font = `600 ${landscape ? 28 : 26}px ${family}`;
  ctx.fillText(vendor.owner || 'Business Owner', mainX, titleY + 72);
  ctx.globalAlpha = 0.72;
  ctx.font = `400 ${landscape ? 20 : 19}px ${family}`;
  ctx.fillText(truncate(ctx, [vendor.category, config.tagline].filter(Boolean).join(' · '), mainWidth), mainX, titleY + 108);
  ctx.globalAlpha = 1;

  const details: string[] = [];
  if (config.showPhone && vendor.phone) details.push(`PHONE  ${vendor.phone}`);
  if (config.showEmail && email) details.push(`EMAIL  ${email}`);
  if (config.showUpi && vendor.upiId) details.push(`UPI  ${vendor.upiId}`);
  if (config.showLocation && vendor.location) details.push(`LOCATION  ${vendor.location}`);
  if (config.showHours && vendor.hours) details.push(`HOURS  ${vendor.hours}`);

  const detailX = mainX;
  let detailY = landscape ? 300 : 575;
  const lineHeight = landscape ? 44 : 48;
  ctx.font = `500 ${landscape ? 20 : 20}px ${family}`;
  details.slice(0, 5).forEach((detail) => {
    ctx.fillStyle = config.accentColor;
    ctx.beginPath(); ctx.arc(detailX + 6, detailY - 7, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = config.textColor;
    ctx.globalAlpha = 0.9;
    ctx.fillText(truncate(ctx, detail, landscape ? 470 : 470), detailX + 28, detailY);
    ctx.globalAlpha = 1;
    detailY += lineHeight;
  });

  if (config.showDescription && vendor.description) {
    ctx.fillStyle = config.textColor; ctx.globalAlpha = 0.65;
    ctx.font = `400 ${landscape ? 17 : 18}px ${family}`;
    ctx.fillText(truncate(ctx, vendor.description, landscape ? 520 : 570), mainX, Math.min(height - 45, detailY + 10));
    ctx.globalAlpha = 1;
  }

  if (config.showQr && vendor.upiId) {
    try {
      const svg = toSVG(upiUri({ pa: vendor.upiId, pn: vendor.name || vendor.owner || 'SahAI Vendor' }), {
        size: 220, margin: 2, level: 'M', dark: '#111111', light: '#ffffff',
      });
      const qrImage = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      const qrSize = landscape ? 150 : 180;
      const qrX = landscape ? width - qrSize - 48 : width - qrSize - 55;
      const qrY = landscape ? height - qrSize - 42 : height - qrSize - 55;
      ctx.fillStyle = '#ffffff';
      roundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 18); ctx.fill();
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    } catch { /* card remains downloadable without QR */ }
  }

  ctx.fillStyle = config.accentColor;
  ctx.font = `700 16px ${family}`;
  ctx.textAlign = 'right';
  ctx.fillText('SAHAI DIGITAL BUSINESS CARD', width - 42, height - 24);
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create JPG')), 'image/jpeg', 0.94);
  });
}

export default function BusinessCardPage() {
  const { data: vendor, isLoading: profileLoading } = useProfile();
  const { data: savedConfig, isLoading: configLoading } = useBusinessCard();
  const updateCard = useUpdateBusinessCard();
  const { user } = useAuth();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<BusinessCardConfig>(DEFAULT_CARD);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (savedConfig) setConfig(editableCard(savedConfig));
  }, [savedConfig]);

  useEffect(() => {
    if (vendor && previewRef.current) {
      drawCard(previewRef.current, config, vendor, user?.email || '').catch(() => {});
    }
  }, [config, user?.email, vendor]);

  const dirty = useMemo(() => {
    if (!savedConfig) return false;
    return JSON.stringify(editableCard(savedConfig)) !== JSON.stringify(config);
  }, [config, savedConfig]);

  const update = <K extends keyof BusinessCardConfig>(key: K, value: BusinessCardConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    try {
      const saved = await updateCard.mutateAsync(config);
      setConfig(editableCard(saved));
      toast.success('Business card design saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save business card');
    }
  };

  const createJpg = async () => {
    if (!vendor) throw new Error('Business Profile is not available');
    const canvas = document.createElement('canvas');
    await drawCard(canvas, config, vendor, user?.email || '');
    return canvasBlob(canvas);
  };

  const fileName = `${(vendor?.name || 'sahai-business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sahai-business'}-card.jpg`;

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadJpg = async () => {
    try {
      setExporting(true);
      const blob = await createJpg();
      downloadBlob(blob);
      toast.success('Business card downloaded as JPG');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download card');
    } finally {
      setExporting(false);
    }
  };

  const shareCard = async () => {
    try {
      setExporting(true);
      const blob = await createJpg();
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: vendor?.name || 'My Business Card',
          text: `Business card for ${vendor?.name || 'my business'}`,
          files: [file],
        });
      } else {
        downloadBlob(blob);
        toast.success('File sharing is unavailable here, so the JPG was downloaded');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast.error('Could not share business card');
    } finally {
      setExporting(false);
    }
  };

  if (profileLoading || configLoading) {
    return <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><Skeleton className="h-[520px] rounded-2xl" /><Skeleton className="h-[520px] rounded-2xl" /></div>;
  }

  if (!vendor) {
    return <Card className="p-8 text-center"><p className="font-semibold">Complete your Business Profile before creating a card.</p></Card>;
  }

  const toggles: { key: keyof BusinessCardConfig; label: string }[] = [
    { key: 'showPhoto', label: 'Profile photo' },
    { key: 'showPhone', label: 'Phone number' },
    { key: 'showEmail', label: 'Email address' },
    { key: 'showUpi', label: 'UPI ID' },
    { key: 'showLocation', label: 'Location' },
    { key: 'showHours', label: 'Opening hours' },
    { key: 'showDescription', label: 'Description' },
    { key: 'showQr', label: 'UPI QR code' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Business Card</h2>
          <p className="text-sm text-gray-500">Create a professional, profile-powered card for download and sharing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={shareCard} disabled={exporting}><Share2 className="h-4 w-4" /> Share</Button>
          <Button variant="outline" onClick={downloadJpg} disabled={exporting}><Download className="h-4 w-4" /> JPG</Button>
          <Button onClick={save} disabled={updateCard.isPending || !dirty}><Save className="h-4 w-4" /> {updateCard.isPending ? 'Saving…' : dirty ? 'Save Design' : 'Saved'}</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Live preview</p>
                <p className="text-xs text-gray-500">JPG output matches this canvas.</p>
              </div>
              {dirty && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Unsaved changes</span>}
            </div>
            <div className="rounded-2xl bg-gray-100 p-3 dark:bg-zinc-900 sm:p-6">
              <motion.canvas
                key={`${config.orientation}-${config.template}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                ref={previewRef}
                className="mx-auto block h-auto max-h-[650px] w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <ImageIcon className="mt-0.5 h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-semibold">Profile-powered details</p>
                <p className="mt-1 text-xs text-gray-500">Business name, owner, phone, UPI, location, hours, description and profile image come from Business Profile. Email comes from the signed-in account.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><LayoutTemplate className="h-4 w-4" /> Template</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['modern', 'classic', 'minimal'] as const).map((template) => (
                <button key={template} onClick={() => update('template', template)}
                  className={`rounded-xl border p-3 text-sm font-medium capitalize transition ${config.template === template ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 hover:border-primary-300 dark:border-zinc-800'}`}>
                  {template}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['landscape', 'portrait'] as const).map((orientation) => (
                <button key={orientation} onClick={() => update('orientation', orientation)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize ${config.orientation === orientation ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 dark:border-zinc-800'}`}>
                  {orientation}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Palette className="h-4 w-4" /> Colors</h3>
            <div className="grid grid-cols-3 gap-2">
              {PALETTES.map((palette) => (
                <button key={palette.name} title={palette.name}
                  onClick={() => setConfig((current) => ({ ...current, backgroundColor: palette.bg, accentColor: palette.accent, textColor: palette.text }))}
                  className="h-12 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700" style={{ background: palette.bg }}>
                  <span className="mx-auto block h-5 w-5 rounded-full" style={{ background: palette.accent }} />
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
              {[
                ['backgroundColor', 'Background'], ['accentColor', 'Accent'], ['textColor', 'Text'],
              ].map(([key, label]) => (
                <label key={key} className="space-y-1">
                  <input type="color" value={config[key as 'backgroundColor' | 'accentColor' | 'textColor']}
                    onChange={(event) => update(key as 'backgroundColor' | 'accentColor' | 'textColor', event.target.value)}
                    className="h-10 w-full cursor-pointer rounded-lg border-0 bg-transparent" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Type className="h-4 w-4" /> Typography</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FONT_LABELS) as BusinessCardConfig['fontFamily'][]).map((font) => (
                <button key={font} onClick={() => update('fontFamily', font)} style={{ fontFamily: FONT_STACKS[font] }}
                  className={`rounded-xl border px-2 py-3 text-xs font-semibold ${config.fontFamily === font ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-zinc-800'}`}>
                  {FONT_LABELS[font]}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Input label="Tagline" value={config.tagline} maxLength={80} onChange={(event) => update('tagline', event.target.value)} placeholder="Professional service you can trust" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold"><Eye className="h-4 w-4" /> Visible details</h3>
              <button onClick={() => setConfig(DEFAULT_CARD)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"><RefreshCw className="h-3.5 w-3.5" /> Reset</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {toggles.map(({ key, label }) => {
                const enabled = Boolean(config[key]);
                return (
                  <button key={key} onClick={() => update(key, !enabled as never)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-medium ${enabled ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 text-gray-500 dark:border-zinc-800'}`}>
                    <span>{label}</span>{enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
