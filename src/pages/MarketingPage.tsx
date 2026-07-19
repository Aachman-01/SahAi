import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, Instagram, Facebook, MessageCircle, Image as ImageIcon, CreditCard, FileText, QrCode, Sparkles } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useProfile } from '@/hooks/useApi';
import toast from 'react-hot-toast';

const MATERIALS = [
  { id: 'instagram', label: 'Instagram Post', icon: Instagram, color: 'from-pink-500 to-rose-500', size: '1080 × 1080' },
  { id: 'facebook', label: 'Facebook Post', icon: Facebook, color: 'from-blue-500 to-blue-600', size: '1200 × 630' },
  { id: 'festival', label: 'Festival Poster', icon: Sparkles, color: 'from-amber-500 to-orange-500', size: '1080 × 1350' },
  { id: 'whatsapp', label: 'WhatsApp Status', icon: MessageCircle, color: 'from-green-500 to-emerald-500', size: '1080 × 1920' },
  { id: 'banner', label: 'Business Banner', icon: ImageIcon, color: 'from-purple-500 to-indigo-500', size: '1920 × 600' },
  { id: 'card', label: 'Business Card', icon: CreditCard, color: 'from-slate-600 to-zinc-700', size: '1050 × 600' },
  { id: 'flyer', label: 'Flyer', icon: FileText, color: 'from-red-500 to-rose-500', size: '1240 × 1754' },
  { id: 'qrposter', label: 'QR Poster', icon: QrCode, color: 'from-primary-500 to-secondary-500', size: '1080 × 1350' },
];

export default function MarketingPage() {
  const [preview, setPreview] = useState<typeof MATERIALS[number] | null>(null);
  const { data: vendor } = useProfile();
  const bizName = vendor?.name || 'Your Business';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Marketing Kit</h2>
          <p className="text-sm text-gray-500">AI-generated marketing materials, ready to download</p>
        </div>
        <Button onClick={() => toast.success('Regenerating all materials...')}><Sparkles className="h-4 w-4" /> Regenerate All</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {MATERIALS.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hover className="overflow-hidden">
              <div className={`relative aspect-[4/5] bg-gradient-to-br ${m.color} flex items-center justify-center text-white`}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="relative text-center">
                  <m.icon className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-xs font-semibold">{m.size}</p>
                </div>
                <Badge color="primary" className="absolute top-2 left-2 bg-white/90">{bizName}</Badge>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm">{m.label}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreview(m)}><Eye className="h-3.5 w-3.5" /> Preview</Button>
                  <Button size="sm" className="flex-1" onClick={() => toast.success(`${m.label} downloaded`)}><Download className="h-3.5 w-3.5" /> PNG</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.label} size="lg">
        {preview && (
          <div>
            <div className={`relative aspect-[4/5] rounded-2xl bg-gradient-to-br ${preview.color} flex items-center justify-center text-white max-h-[60vh] mx-auto`}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <div className="relative text-center">
                <preview.icon className="h-16 w-16 mx-auto mb-3" />
                <h3 className="text-2xl font-bold">{bizName}</h3>
                <p className="text-sm text-white/90">{vendor?.category || 'Your products & services'}</p>
                <p className="text-xs text-white/80 mt-2">{(vendor?.location || 'Your location')} · {(vendor?.hours || 'Your hours')}</p>
                <p className="text-xs text-white/80">{vendor?.upiId || 'yourupi@bank'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>
              <Button onClick={() => toast.success('Downloaded')}><Download className="h-4 w-4" /> Download PNG</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
