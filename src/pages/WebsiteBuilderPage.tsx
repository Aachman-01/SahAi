import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2, Eye, Code, FileArchive, Check,
  Smartphone, Tablet, Monitor, Sparkles, Star, MapPin, Clock, Phone, MessageCircle,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProducts, useReviews, useProfile, useWebsite, useUpdateWebsite } from '@/hooks/useApi';
import { toSVG, upiUri } from '@/lib/qrcode';
import { resolveImageUrl } from '@/lib/api';
import { callHref, directionsHref, whatsappHref } from '@/utils/contactLinks';
import { formatINR } from '@/utils/format';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'food', name: 'Food', color: 'from-orange-500 to-red-500' },
  { id: 'tea', name: 'Tea', color: 'from-amber-500 to-yellow-500' },
  { id: 'vegetables', name: 'Vegetables', color: 'from-green-500 to-emerald-500' },
  { id: 'flowers', name: 'Flowers', color: 'from-pink-500 to-rose-500' },
  { id: 'general', name: 'General Store', color: 'from-blue-500 to-cyan-500' },
  { id: 'juice', name: 'Juice', color: 'from-lime-500 to-green-500' },
  { id: 'bakery', name: 'Bakery', color: 'from-amber-600 to-orange-400' },
  { id: 'medical', name: 'Medical', color: 'from-teal-500 to-cyan-600' },
  { id: 'electronics', name: 'Electronics', color: 'from-slate-600 to-zinc-700' },
];

const PREVIEW_DEVICE = { mobile: 'max-w-[375px]', tablet: 'max-w-[768px]', desktop: 'max-w-full' };

export default function WebsiteBuilderPage() {
  const { data: website } = useWebsite();
  const updateWebsite = useUpdateWebsite();
  const { data: products = [] } = useProducts();
  const { data: reviews = [] } = useReviews();
  const { data: vendor } = useProfile();

  const [template, setTemplate] = useState('food');
  const [device, setDevice] = useState<keyof typeof PREVIEW_DEVICE>('desktop');

  useEffect(() => { if (website?.template) setTemplate(website.template); }, [website]);

  const tpl = TEMPLATES.find((t) => t.id === template)!;
  const slug = website?.slug || 'rahul-fruits';
  const published = website?.published;
  const initials = (vendor?.name || 'RF').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const chooseTemplate = async (id: string) => {
    setTemplate(id);
    try { await updateWebsite.mutateAsync({ template: id }); toast.success('Template saved'); }
    catch { toast.error('Could not save template'); }
  };

  const publish = async () => {
    try {
      await updateWebsite.mutateAsync({ template, published: true });
      toast.success('Website published!');
    } catch { toast.error('Could not publish'); }
  };

  const callBusiness = () => {
    const href = callHref(vendor?.phone);
    if (!href) return toast.error('Add a phone number in Business Profile first');
    window.location.href = href;
  };

  const openDirections = () => {
    const href = directionsHref(vendor?.location);
    if (!href) return toast.error('Add a business location in Business Profile first');
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const openWhatsApp = () => {
    const href = whatsappHref(vendor?.phone);
    if (!href) return toast.error('Add a phone number in Business Profile first');
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Website Builder</h2>
          <p className="text-sm text-gray-500">yourdomain.com/customer/{slug} {published ? <Badge color="green" className="ml-2">Live</Badge> : <Badge color="gray" className="ml-2">Draft</Badge>}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/customer/${slug}`); toast.success('Link copied!'); }}><Share2 className="h-4 w-4" /> Share</Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('Exported as ZIP')}><FileArchive className="h-4 w-4" /> Export ZIP</Button>
          <Button size="sm" onClick={publish} disabled={updateWebsite.isPending}><Sparkles className="h-4 w-4" /> {published ? 'Update' : 'Publish'}</Button>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3 text-sm">Choose a template</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => chooseTemplate(t.id)} className="relative">
              <div className={`h-16 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs ${template === t.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-zinc-900' : ''}`}>
                {t.name}
              </div>
              {template === t.id && <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} onClick={() => setDevice(d)} className={`p-2 rounded ${device === d ? 'bg-white dark:bg-zinc-900 shadow-soft' : ''}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
        <Badge color="primary"><Eye className="h-3 w-3" /> Live Preview</Badge>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex justify-center bg-gray-100 dark:bg-zinc-900 p-4 sm:p-8">
          <motion.div key={device + template} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`w-full ${PREVIEW_DEVICE[device]} rounded-2xl overflow-hidden shadow-float bg-white dark:bg-zinc-950 transition-all`}>
            <div className={`relative h-44 bg-gradient-to-br ${tpl.color} flex items-center justify-center text-white`}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative text-center">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2 text-2xl font-bold">{initials}</div>
                <h1 className="text-2xl font-bold">{vendor?.name}</h1>
                <p className="text-sm text-white/90">{vendor?.category} · {vendor?.location}</p>
              </div>
            </div>

            <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-zinc-800">
              <Button size="sm" className="flex-1" onClick={openWhatsApp}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={callBusiness}><Phone className="h-4 w-4" /> Call</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={openDirections}><MapPin className="h-4 w-4" /> Directions</Button>
            </div>

            <div className="p-4">
              <h3 className="font-bold mb-1">About</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">{vendor?.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {vendor?.hours}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent-500 text-accent-500" /> {vendor?.rating} ({reviews.length})</span>
              </div>
            </div>

            <div className="px-4 pb-4">
              <h3 className="font-bold mb-2">Products</h3>
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} className="rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                    <img src={resolveImageUrl(p.image)} alt={p.name} className="h-20 w-full object-cover" loading="lazy" />
                    <div className="p-2"><p className="text-xs font-semibold truncate">{p.name}</p><p className="text-xs text-primary-600 font-bold">{formatINR(p.price)}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 pb-4">
              <h3 className="font-bold mb-2">Reviews</h3>
              <div className="space-y-2">
                {reviews.slice(0, 2).map((r) => (
                  <div key={r.id} className="rounded-xl bg-gray-50 dark:bg-zinc-900 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold">{r.author}</p>
                      <div className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-3 w-3 ${j < r.rating ? 'fill-accent-500 text-accent-500' : 'text-gray-300'}`} />)}</div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="m-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 p-4 text-center">
              <p className="text-xs font-semibold mb-2">Scan to Pay</p>
              <div
                className="mx-auto h-24 w-24 rounded-lg bg-white p-2"
                dangerouslySetInnerHTML={{
                  __html: toSVG(upiUri({ pa: vendor?.upiId || 'sahai@upi', pn: vendor?.name }), {
                    size: 80, margin: 4, level: 'M', dark: '#15803d', light: '#ffffff',
                  }),
                }}
              />
              <p className="text-xs text-gray-500 mt-2">{vendor?.upiId}</p>
            </div>
          </motion.div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Code, label: 'HTML', desc: 'Source code' },
          { icon: Code, label: 'CSS', desc: 'Stylesheet' },
          { icon: FileArchive, label: 'Images', desc: 'All assets' },
          { icon: FileArchive, label: 'ZIP', desc: 'Everything' },
        ].map((e) => (
          <Card key={e.label} hover className="p-4 text-center" >
            <div onClick={() => toast.success(`${e.label} downloaded`)}>
              <e.icon className="h-6 w-6 mx-auto text-primary-600 mb-2" />
              <p className="text-sm font-semibold">{e.label}</p>
              <p className="text-xs text-gray-500">{e.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
