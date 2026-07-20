import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, Printer, CreditCard, Image as ImageIcon, Moon, Sun,
  Palette, Volume2, Wallet, CheckCircle2, Save, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTransactions, useQr, useUpdateQr, useBusinessProfile, useUpdateBusinessProfile } from '@/hooks/useApi';
import { toSVG, upiUri } from '@/lib/qrcode';
import { formatINR } from '@/utils/format';
import { validateBusinessProfile, formatBusinessUpdatedAt, type BusinessFieldErrors } from '@/utils/validation';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';

const COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#dc2626', '#7c3aed', '#0891b2'];

export default function QrPaymentPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { data: qr } = useQr();
  const { data: businessProfile } = useBusinessProfile();
  const { data: transactions = [] } = useTransactions();
  const updateQr = useUpdateQr();
  const updateBusinessProfile = useUpdateBusinessProfile();

  const [upiId, setUpiId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [sound, setSound] = useState(true);
  const [errors, setErrors] = useState<BusinessFieldErrors>({});
  const [conflictWarning, setConflictWarning] = useState('');

  useEffect(() => {
    if (qr) {
      setColor(qr.color || COLORS[0]);
      setSound(qr.sound);
    }
  }, [qr]);

  // Shared fields always come from the same React Query cache as Profile.
  useEffect(() => {
    if (businessProfile) {
      setUpiId(businessProfile.upiId);
      setName(businessProfile.businessName);
      setPhone(businessProfile.phone);
    }
  }, [businessProfile]);

  const saving = updateQr.isPending || updateBusinessProfile.isPending;

  const save = async () => {
    // Validate the shared fields client-side first.
    const errs = validateBusinessProfile({ businessName: name, phone, upiId });
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Please fix the highlighted fields');
      return;
    }
    setErrors({});
    try {
      // Shared fields go through the single source-of-truth endpoint so the
      // Business Profile page reflects the change automatically.
      const saved = await updateBusinessProfile.mutateAsync({
        businessName: name,
        phone,
        upiId,
        baseUpdatedAt: businessProfile?.updatedAt ?? null,
      });
      if (saved.conflict) {
        setConflictWarning('Another device saved changes after this form was loaded. Your latest save was applied.');
      } else {
        setConflictWarning('');
      }
      // QR-only style settings (color/sound) are saved separately.
      await updateQr.mutateAsync({ color, sound });
      toast.success('QR settings saved!');
    } catch (err: any) {
      const fields = err?.response?.data?.fields as BusinessFieldErrors | undefined;
      if (fields) setErrors(fields);
      toast.error(err?.response?.data?.error || 'Could not save');
    }
  };

  const setSoundPersist = (v: boolean) => {
    setSound(v);
    updateQr.mutate({ sound: v });
  };

  // Real, scannable UPI QR encoding a `upi://pay?...` deep link (works in GPay, PhonePe, Paytm, BHIM).
  const qrSvg = (size = 200) => {
    const payload = upiUri({ pa: upiId || 'sahai@upi', pn: name || 'SahAI Vendor' });
    return toSVG(payload, { size, margin: 4, level: 'M', dark: color, light: '#ffffff' });
  };

  const download = (type: 'png' | 'pdf') => {
    const svg = qrSvg(600);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahai-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type.toUpperCase()} downloaded`);
  };

  const initials = (name || 'RF').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`p-8 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="flex justify-end mb-2">
              <button onClick={toggle} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-3 text-white font-bold text-xl">{initials}</div>
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-sm text-gray-500">{upiId}</p>
              <div className="my-5 p-4 rounded-2xl bg-white shadow-float">
                <div className="w-48 h-48" dangerouslySetInnerHTML={{ __html: qrSvg(192) }} />
              </div>
              <p className="text-xs text-gray-500 mb-4">Scan to pay via UPI</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => download('png')}><Download className="h-4 w-4" /> PNG</Button>
                <Button size="sm" variant="outline" onClick={() => download('pdf')}><Download className="h-4 w-4" /> PDF</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success('Sent to print')}><Printer className="h-4 w-4" /> Print</Button>
              </div>
            </div>
          </Card>

          <Card className="p-5 mt-4">
            <h4 className="font-semibold mb-3 text-sm">QR Styles</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ImageIcon, label: 'QR Stand' },
                { icon: CreditCard, label: 'Business Card' },
                { icon: Printer, label: 'Poster' },
              ].map((s) => (
                <button key={s.label} onClick={() => s.label === 'Business Card' ? navigate('/dashboard/business-card') : toast.success(`${s.label} preview`)} className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 p-3 hover:border-primary-400 transition-colors">
                  <s.icon className="h-5 w-5 text-primary-600" /><span className="text-xs font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">QR Details</h3>
                <p className="mt-1 text-xs text-gray-400">Last updated: {formatBusinessUpdatedAt(businessProfile?.updatedAt)}</p>
              </div>
              <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</Button>
            </div>
            {conflictWarning && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{conflictWarning}</span>
              </div>
            )}
            <div className="space-y-4">
              <Input label="UPI ID" value={upiId} onChange={(e) => { setUpiId(e.target.value); setErrors((p) => (p.upiId ? { ...p, upiId: undefined } : p)); }} error={errors.upiId} />
              <Input label="Business Name" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => (p.businessName ? { ...p, businessName: undefined } : p)); }} error={errors.businessName} />
              <Input label="Phone Number" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((p) => (p.phone ? { ...p, phone: undefined } : p)); }} error={errors.phone} />
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-1.5"><Palette className="h-4 w-4" /> QR Color</p>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} style={{ background: c }}
                      className={`h-9 w-9 rounded-lg ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-900' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-3 dark:bg-zinc-900">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Volume2 className="h-4 w-4 shrink-0 text-primary-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Payment Sound</p>
                    <p className="text-xs text-gray-500">Play sound on payment</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sound}
                  aria-label="Payment Sound"
                  onClick={() => setSoundPersist(!sound)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${sound ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${sound ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-1 flex items-center gap-2"><Wallet className="h-4 w-4 text-primary-600" /> Transaction History</h3>
            <p className="text-xs text-gray-500 mb-4">Recent UPI payments</p>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-primary-600" /></div>
                    <div><p className="text-sm font-medium">{t.method} · {t.status}</p><p className="text-xs text-gray-500">{t.date}</p></div>
                  </div>
                  <p className="text-sm font-bold">{formatINR(t.amount)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
