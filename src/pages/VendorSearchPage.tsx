import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Store, MapPin, Star, ArrowLeft, User, Phone, Clock, Tag,
  Package, Megaphone, CreditCard, Image as ImageIcon, AtSign, Eye,
  Instagram, Facebook, MessageCircle, FileText, QrCode, Sparkles,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { get, resolveImageUrl } from '@/lib/api';
import { toSVG, upiUri } from '@/lib/qrcode';
import { formatINR } from '@/utils/format';
import type { BusinessCardConfig, MarketingMaterial, Product } from '@/types';

interface VendorSearchResult {
  username: string;
  name: string;
  owner: string;
  category: string;
  location: string;
  logo?: string;
  rating: number;
}

interface PublicVendor {
  username: string;
  name: string;
  owner: string;
  phone: string;
  upiId: string;
  category: string;
  location: string;
  hours: string;
  logo?: string;
  photo?: string;
  rating: number;
  description: string;
}

interface PublicGalleryImage { id: string; url: string; caption?: string }
interface PublicVendorData {
  vendor: PublicVendor;
  products: Product[];
  gallery: PublicGalleryImage[];
  marketing: MarketingMaterial[];
  businessCard: BusinessCardConfig;
  readOnly: true;
}

type Tab = 'business' | 'products' | 'marketing' | 'card';

const MARKETING_ICONS: Record<string, typeof ImageIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  festival: Sparkles,
  whatsapp: MessageCircle,
  banner: ImageIcon,
  card: CreditCard,
  flyer: FileText,
  qrposter: QrCode,
};

function initials(name: string) {
  return (name || 'SB').split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function VendorDirectory() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim().toLowerCase().replace(/^@/, '')), 250);
    return () => window.clearTimeout(timer);
  }, [input]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['vendor-search', query],
    queryFn: () => get<VendorSearchResult[]>(`/api/vendors/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Vendor Search</h2>
        <p className="text-sm text-gray-500">Find another SahAI vendor by their unique username.</p>
      </div>

      <Card className="p-5 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Search username or business name</label>
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Try @username or a business name"
            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-800 dark:bg-zinc-900"
          />
          {isFetching && <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />}
        </div>
        <p className="mt-2 text-xs text-gray-500">Enter at least 2 characters. Your own vendor profile is excluded.</p>
      </Card>

      {query.length < 2 ? (
        <Card className="p-10 text-center">
          <AtSign className="mx-auto h-10 w-10 text-primary-500" />
          <p className="mt-3 font-semibold">Search by a unique vendor username</p>
          <p className="mt-1 text-sm text-gray-500">Only public business information is visible.</p>
        </Card>
      ) : !isFetching && results.length === 0 ? (
        <Card className="p-10 text-center">
          <Store className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 font-semibold">No vendors found</p>
          <p className="mt-1 text-sm text-gray-500">Check the username and try again.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((vendor, index) => (
            <motion.button
              key={vendor.username}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigate(`/dashboard/vendors/${encodeURIComponent(vendor.username)}`)}
              className="text-left"
            >
              <Card hover className="h-full p-5">
                <div className="flex items-start gap-4">
                  {vendor.logo ? (
                    <img src={resolveImageUrl(vendor.logo)} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{initials(vendor.name)}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{vendor.name || 'Unnamed Business'}</h3>
                    <p className="truncate text-sm font-medium text-primary-600">@{vendor.username}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{vendor.category || 'General'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" /> {vendor.location || 'Location not added'}</span>
                  <span className="ml-2 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {vendor.rating || 0}</span>
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReadOnlyBusinessCard({ vendor, config }: { vendor: PublicVendor; config: BusinessCardConfig }) {
  const landscape = config.orientation !== 'portrait';
  const qr = useMemo(() => {
    if (!config.showQr || !vendor.upiId) return '';
    return toSVG(upiUri({ pa: vendor.upiId, pn: vendor.name || vendor.owner || 'SahAI Vendor' }), {
      size: 160, margin: 2, level: 'M', dark: '#111111', light: '#ffffff',
    });
  }, [config.showQr, vendor.name, vendor.owner, vendor.upiId]);

  const font = config.fontFamily === 'serif' ? 'Georgia, serif' : config.fontFamily === 'mono' ? 'Courier New, monospace' : 'Arial, sans-serif';
  return (
    <div className="flex justify-center p-2 sm:p-5">
      <div
        className={`relative w-full overflow-hidden rounded-3xl p-6 shadow-2xl ${landscape ? 'max-w-4xl aspect-[7/4]' : 'max-w-md aspect-[2/3]'}`}
        style={{ background: config.backgroundColor, color: config.textColor, fontFamily: font, border: config.template === 'classic' ? `6px double ${config.accentColor}` : undefined }}
      >
        {config.template === 'modern' && <div className={`absolute ${landscape ? 'inset-y-0 left-0 w-[32%]' : 'inset-x-0 top-0 h-[30%]'}`} style={{ background: config.accentColor, clipPath: landscape ? 'polygon(0 0,100% 0,78% 100%,0 100%)' : 'polygon(0 0,100% 0,100% 72%,0 100%)' }} />}
        {config.template === 'minimal' && <div className={`absolute ${landscape ? 'inset-y-0 left-0 w-2' : 'inset-x-0 top-0 h-2'}`} style={{ background: config.accentColor }} />}
        <div className={`relative z-10 flex h-full ${landscape ? 'items-center gap-8' : 'flex-col items-center gap-5 text-center'}`}>
          {config.showPhoto && (
            <div className={`shrink-0 overflow-hidden rounded-full border-4 ${landscape ? 'h-28 w-28 sm:h-36 sm:w-36' : 'mt-5 h-32 w-32'}`} style={{ borderColor: config.textColor, background: config.accentColor }}>
              {vendor.logo || vendor.photo ? <img src={resolveImageUrl(vendor.logo || vendor.photo)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl font-bold">{initials(vendor.name)}</div>}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold sm:text-4xl">{vendor.name || 'Business Name'}</h3>
            <div className="my-3 h-1 w-24 rounded" style={{ background: config.accentColor }} />
            <p className="text-base font-semibold sm:text-xl">{vendor.owner || 'Business Owner'}</p>
            <p className="mt-1 text-xs opacity-75 sm:text-sm">{[vendor.category, config.tagline].filter(Boolean).join(' · ')}</p>
            <div className={`mt-5 grid gap-2 text-xs sm:text-sm ${landscape ? 'sm:grid-cols-2' : ''}`}>
              {config.showPhone && vendor.phone && <span>Phone: {vendor.phone}</span>}
              {config.showUpi && vendor.upiId && <span>UPI: {vendor.upiId}</span>}
              {config.showLocation && vendor.location && <span>Location: {vendor.location}</span>}
              {config.showHours && vendor.hours && <span>Hours: {vendor.hours}</span>}
            </div>
            {config.showDescription && vendor.description && <p className="mt-4 text-xs opacity-70">{vendor.description}</p>}
          </div>
          {qr && <div className="shrink-0 rounded-xl bg-white p-2"><div className="h-24 w-24 sm:h-32 sm:w-32" dangerouslySetInnerHTML={{ __html: qr }} /></div>}
        </div>
        <span className="absolute bottom-3 right-4 text-[9px] font-bold" style={{ color: config.accentColor }}>VIEW ONLY · SAHAI</span>
      </div>
    </div>
  );
}

function VendorProfileView({ username }: { username: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('business');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-vendor-profile', username],
    queryFn: () => get<PublicVendorData>(`/api/vendors/${encodeURIComponent(username)}`),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div>;
  if (isError || !data) return <Card className="p-10 text-center"><p className="font-semibold">Vendor not found</p><button onClick={() => navigate('/dashboard/vendors')} className="mt-3 text-sm font-medium text-primary-600">Back to Vendor Search</button></Card>;

  const { vendor, products, gallery, marketing, businessCard } = data;
  const tabs: { id: Tab; label: string; icon: typeof Store; count?: number }[] = [
    { id: 'business', label: 'Business', icon: Store },
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'card', label: 'Business Card', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard/vendors')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600"><ArrowLeft className="h-4 w-4" /> Back to Vendor Search</button>

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary-600 to-secondary-600" />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            {vendor.logo ? <img src={resolveImageUrl(vendor.logo)} alt="" className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow dark:border-zinc-900" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-primary-100 text-xl font-bold text-primary-700 shadow dark:border-zinc-900 dark:bg-primary-900/40 dark:text-primary-300">{initials(vendor.name)}</div>}
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold">{vendor.name}</h2>
              <p className="font-medium text-primary-600">@{vendor.username}</p>
            </div>
            <Badge color="green"><Eye className="h-3 w-3" /> Read-only profile</Badge>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        {tabs.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${tab === item.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
            <item.icon className="h-4 w-4" /> {item.label}{item.count !== undefined && <span className="opacity-70">({item.count})</span>}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <Card className="p-6">
            <h3 className="mb-4 font-bold">Business Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                { icon: User, label: 'Owner', value: vendor.owner },
                { icon: Phone, label: 'Phone', value: vendor.phone },
                { icon: Tag, label: 'Category', value: vendor.category },
                { icon: MapPin, label: 'Location', value: vendor.location },
                { icon: Clock, label: 'Opening Hours', value: vendor.hours },
                { icon: AtSign, label: 'Username', value: `@${vendor.username}` },
              ] as { icon: typeof User; label: string; value: string }[]).map(({ icon: DetailIcon, label, value }) => (
                <div key={label} className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-950">
                  <p className="flex items-center gap-2 text-xs text-gray-500"><DetailIcon className="h-3.5 w-3.5" /> {label}</p>
                  <p className="mt-1 text-sm font-semibold">{value || 'Not provided'}</p>
                </div>
              ))}
            </div>
            {vendor.description && <div className="mt-5"><p className="text-xs text-gray-500">About</p><p className="mt-1 text-sm leading-6">{vendor.description}</p></div>}
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><ImageIcon className="h-4 w-4" /> Business Photos</h3>
            {gallery.length ? <div className="grid grid-cols-2 gap-3">{gallery.map((image) => <img key={image.id} src={resolveImageUrl(image.url)} alt={image.caption || vendor.name} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />)}</div> : <p className="text-sm text-gray-500">No public business photos yet.</p>}
          </Card>
        </div>
      )}

      {tab === 'products' && (
        products.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <Card key={product.id} className="overflow-hidden"><div className="aspect-square bg-gray-100 dark:bg-zinc-900">{product.image ? <img src={resolveImageUrl(product.image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-gray-300" /></div>}</div><div className="p-4"><h3 className="font-bold">{product.name}</h3><p className="text-xs text-gray-500">{product.category}</p><p className="mt-2 font-bold text-primary-600">{formatINR(product.offerPrice ?? product.price)}</p>{product.description && <p className="mt-2 line-clamp-2 text-xs text-gray-500">{product.description}</p>}</div></Card>)}</div> : <Card className="p-10 text-center"><Package className="mx-auto h-10 w-10 text-gray-400" /><p className="mt-3 text-sm text-gray-500">No available products.</p></Card>
      )}

      {tab === 'marketing' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {marketing.map((material) => {
            const Icon = MARKETING_ICONS[material.id] || ImageIcon;
            return <Card key={material.id} className="overflow-hidden"><div className={`relative flex aspect-[4/5] items-center justify-center bg-gradient-to-br ${material.color} text-white`}><div className="text-center"><Icon className="mx-auto h-10 w-10" /><h3 className="mt-3 px-3 font-bold">{vendor.name}</h3><p className="mt-1 text-xs text-white/80">{vendor.category || 'Products & services'}</p></div><span className="absolute right-2 top-2 rounded-full bg-black/20 px-2 py-1 text-[10px]">VIEW ONLY</span></div><div className="p-3"><p className="text-sm font-semibold">{material.label}</p><p className="text-xs text-gray-500">{material.size}</p></div></Card>;
          })}
        </div>
      )}

      {tab === 'card' && <Card className="p-3 sm:p-6"><ReadOnlyBusinessCard vendor={vendor} config={businessCard} /></Card>}
    </div>
  );
}

export default function VendorSearchPage() {
  const { username } = useParams();
  return username ? <VendorProfileView username={username} /> : <VendorDirectory />;
}
