import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Paperclip, Image, Sparkles, Bot, User, ArrowLeft,
  CheckCircle2, QrCode, Globe, Megaphone, Landmark, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Badge } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { patch, put } from '@/lib/api';
import { validateBusinessProfile } from '@/utils/validation';

interface Msg {
  role: 'ai' | 'user';
  text: string;
  results?: { icon: typeof QrCode; label: string; to: string }[];
}

const PROMPTS = [
  'Lucknow Tea Corner',
  'Mumbai Fresh Fruits',
  'Mysuru Flower Shop',
  'Delhi Street Foods',
];

const FLOW: { ai: string; field: string }[] = [
  { ai: "Namaste! I'm SahAI, your digital business assistant. Let's get your business online in minutes. What's your business name?", field: 'businessName' },
  { ai: "Great! What's your name (the owner)?", field: 'ownerName' },
  { ai: "What's your phone number?", field: 'phone' },
  { ai: "What's your UPI ID? (e.g. yourname@upi)", field: 'upiId' },
  { ai: "Where is your shop located? (Area, City)", field: 'location' },
  { ai: "What category best describes your business?", field: 'category' },
  { ai: "What are your opening hours? (e.g. 7 AM – 9 PM)", field: 'hours' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: "Namaste! I'm SahAI, your digital business assistant. Let's get your business online in minutes. What's your business name?" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, typing]);

  const validateAnswer = (field: string | undefined, value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Please enter a value before continuing';
    if (field === 'phone' || field === 'upiId' || field === 'businessName') {
      const errors = validateBusinessProfile({
        ...(field === 'phone' ? { phone: trimmed } : {}),
        ...(field === 'upiId' ? { upiId: trimmed } : {}),
        ...(field === 'businessName' ? { businessName: trimmed } : {}),
      });
      return field === 'businessName'
        ? errors.businessName || null
        : field === 'phone'
          ? errors.phone || null
          : errors.upiId || null;
    }
    return null;
  };

  const saveAnswersToProfile = async (profileAnswers: Record<string, string>) => {
    await patch('/api/business-profile', {
      businessName: profileAnswers.businessName.trim(),
      phone: profileAnswers.phone.trim(),
      upiId: profileAnswers.upiId.trim(),
    });
    await put('/api/profile', {
      owner: profileAnswers.ownerName.trim(),
      location: profileAnswers.location.trim(),
      category: profileAnswers.category.trim(),
      hours: profileAnswers.hours.trim(),
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['qr'] }),
      queryClient.invalidateQueries({ queryKey: ['settings'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const send = (text: string) => {
    if (typing || saving) return;
    const trimmed = text.trim();
    const currentField = FLOW[step]?.field;
    const validationError = validateAnswer(currentField, trimmed);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const newAnswers = currentField ? { ...answers, [currentField]: trimmed } : answers;
    setAnswers(newAnswers);
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setTyping(true);

    setTimeout(async () => {
      if (step < FLOW.length - 1) {
        const next = step + 1;
        setStep(next);
        setTyping(false);
        setMessages((m) => [...m, { role: 'ai', text: FLOW[next].ai }]);
        return;
      }

      try {
        setSaving(true);
        await saveAnswersToProfile(newAnswers);
        setDone(true);
        setMessages((m) => [...m, {
          role: 'ai',
          text: `Done, ${newAnswers.ownerName || 'Vendor'}! Your answers have been saved to your Business Profile and synchronized with QR Payment and Settings.`,
          results: [
            { icon: User, label: 'View Updated Profile', to: '/dashboard/profile' },
            { icon: Globe, label: 'Mini Website', to: '/dashboard/website' },
            { icon: QrCode, label: 'UPI QR Code', to: '/dashboard/qr' },
            { icon: Package, label: 'Product Catalog', to: '/dashboard/products' },
            { icon: Megaphone, label: 'Marketing Kit', to: '/dashboard/marketing' },
            { icon: Landmark, label: 'Govt Schemes', to: '/dashboard/schemes' },
          ],
        }]);
        toast.success('Business Profile updated successfully!');
      } catch (err: any) {
        const message = err?.response?.status === 401
          ? 'Please sign in before using profile autofill'
          : err?.response?.data?.error || 'Could not update your Business Profile';
        setMessages((m) => [...m, {
          role: 'ai',
          text: `${message}. Your answers are still here—please try the last answer again.`,
        }]);
        toast.error(message);
      } finally {
        setSaving(false);
        setTyping(false);
      }
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
      <header className="glass border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-10">
        <div className="mx-auto max-w-3xl flex items-center justify-between h-16 px-4">
          <button onClick={() => nav(-1)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center"><Bot className="h-5 w-5 text-white" /></div>
            <div><p className="text-sm font-bold leading-tight">SahAI Assistant</p><p className="text-xs text-primary-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Online</p></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>Dashboard</Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'ai' ? 'gradient-primary' : 'bg-secondary-600'}`}>
                {m.role === 'ai' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'ai' ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-tl-sm' : 'gradient-primary text-white rounded-tr-sm'}`}>
                {m.text}
                {m.results && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {m.results.map((r) => (
                      <button key={r.label} onClick={() => nav(r.to)} className="flex items-center gap-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 p-2.5 text-left text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 transition-colors">
                        <r.icon className="h-4 w-4" /> {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div>
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {!done && step === 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {PROMPTS.map((p) => (
                <button key={p} onClick={() => send(p)} disabled={typing || saving} className="rounded-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs hover:border-primary-400 hover:text-primary-600 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          )}

          {done && (
            <Card className="p-5 bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-900/40">
              <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-5 w-5 text-primary-600" /><p className="font-bold">Your digital business is ready!</p></div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">Your chat answers were saved to the Business Profile. Review them in your dashboard, then add photos and a description if needed.</p>
              <Button onClick={() => nav('/dashboard')}><Sparkles className="h-4 w-4" /> Go to Dashboard</Button>
            </Card>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"><Paperclip className="h-5 w-5" /></button>
            <button className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"><Image className="h-5 w-5" /></button>
            <input
              value={input}
              disabled={typing || saving || done}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Type your answer..."
              className="flex-1 rounded-xl bg-gray-100 dark:bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <button disabled={typing || saving || done} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 disabled:opacity-50"><Mic className="h-5 w-5" /></button>
            <Button size="icon" onClick={() => send(input)} disabled={typing || saving || done}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
