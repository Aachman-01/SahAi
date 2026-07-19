import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Star, MapPin, Clock, Phone, MessageCircle, Share2, ArrowLeft,
  QrCode, Camera, ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Badge } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { get, resolveImageUrl } from '@/lib/api';
import { toSVG, upiUri } from '@/lib/qrcode';
import { formatINR } from '@/utils/format';
import { callHref, directionsHref, whatsappHref } from '@/utils/contactLinks';
import type { Vendor, Product, Review, QrConfig } from '@/types';
import toast from 'react-hot-toast';

interface PublicSite { vendor: Vendor; products: Product[]; reviews: Review[]; qr: QrConfig }

export default function CustomerWebsitePage() {
  const { vendorSlug } = useParams();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['public-vendor', vendorSlug],
    queryFn: () => get<PublicSite>(`/api/public/vendor/${vendorSlug || 'rahul-fruits'}`),
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 space-y-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { vendor: v, products, reviews, qr } = data;
  const initials = (v.name || 'RF').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const callBusiness = () => {
    const href = callHref(v.phone);
    if (!href) return toast.error('Phone number is not available');
    window.location.href = href;
  };

  const openDirections = () => {
    const href = directionsHref(v.location);
    if (!href) return toast.error('Business location is not available');
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const openWhatsApp = () => {
    const href = whatsappHref(v.phone);
    if (!href) return toast.error('Phone number is not available');
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 glass border-b border-gray-100/50 dark:border-zinc-800/50">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"><ArrowLeft className="h-5 w-5" /></button>
          <p className="text-sm font-semibold">{v.name}</p>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); }} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"><Share2 className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="relative h-56 sm:h-64 gradient-primary text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative mx-auto max-w-5xl px-4 h-full flex flex-col items-center justify-center text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold mb-3">{initials}</motion.div>
          <h1 className="text-3xl font-bold">{v.name}</h1>
          <p className="text-white/90 mt-1">{v.category}</p>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-current" /> {v.rating} ({reviews.length})</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {v.location}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={openWhatsApp}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          <Button variant="outline" onClick={callBusiness}><Phone className="h-4 w-4" /> Call</Button>
          <Button variant="outline" onClick={openDirections}><MapPin className="h-4 w-4" /> Directions</Button>
        </div>

        <Card className="p-5">
          <h3 className="font-bold mb-2">About</h3>
          <p className="text-sm text-gray-600 dark:text-zinc-400">{v.description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {v.hours}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.location}</span>
            <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> UPI Accepted</span>
          </div>
        </Card>

        {products.length > 0 && (
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2"><Camera className="h-4 w-4" /> Gallery</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                  <img src={resolveImageUrl(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img src={resolveImageUrl(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  {p.discount && <Badge color="red" className="absolute top-2 left-2">{p.discount}% OFF</Badge>}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-bold text-sm">{formatINR(p.price)}</span>
                    {p.offerPrice && <span className="text-xs text-gray-400 line-through">{formatINR(p.offerPrice)}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {reviews.length > 0 && (
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2"><Star className="h-4 w-4" /> Reviews</h3>
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{r.author}</p>
                    <div className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-3 w-3 ${j < r.rating ? 'fill-accent-500 text-accent-500' : 'text-gray-300'}`} />)}</div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="p-6 text-center bg-primary-50/50 dark:bg-primary-900/10">
          <h3 className="font-bold mb-1 flex items-center justify-center gap-2"><QrCode className="h-4 w-4" /> Scan to Pay</h3>
          <p className="text-xs text-gray-500 mb-3">Pay via any UPI app</p>
          <div
            className="mx-auto h-32 w-32 rounded-xl bg-white p-2"
            dangerouslySetInnerHTML={{
              __html: toSVG(upiUri({ pa: qr?.upiId || v.upiId, pn: v.name }), {
                size: 112, margin: 4, level: 'M', dark: qr?.color || '#15803d', light: '#ffffff',
              }),
            }}
          />
          <p className="text-xs text-gray-500 mt-3">{qr?.upiId || v.upiId}</p>
        </Card>

        <div className="text-center text-xs text-gray-400 pt-4">
          <p>Powered by SahAI · Empowering street vendors digitally</p>
        </div>
      </div>
    </div>
  );
}
