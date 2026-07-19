import { motion } from 'framer-motion';
import { Search, MapPin, Star, TrendingUp, Check, Lightbulb, Eye, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSeo, useUpdateSeo } from '@/hooks/useApi';
import toast from 'react-hot-toast';

const STAT_ICONS = [Eye, MapPin, Star, LinkIcon];
const STAT_COLORS = ['text-primary-600', 'text-secondary-600', 'text-accent-600', 'text-primary-600'];

export default function SeoPage() {
  const { data: seo, isLoading } = useSeo();
  const updateSeo = useUpdateSeo();

  const checklist = seo?.checklist || [];
  const keywords = seo?.keywords || [];
  const suggestions = seo?.suggestions || [];
  const stats = seo?.stats || [];

  const completed = checklist.filter((c) => c.done).length;
  const score = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;

  const toggleItem = async (id: string) => {
    const next = checklist.map((c) => c.id === id ? { ...c, done: !c.done } : c);
    try { await updateSeo.mutateAsync({ checklist: next }); }
    catch { toast.error('Could not update checklist'); }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Local SEO</h2>
        <p className="text-sm text-gray-500">Get discovered by nearby customers on Google</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Visibility Score</p>
          <div className="relative h-32 w-32 mx-auto">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="10" fill="none" className="text-gray-100 dark:text-zinc-800" />
              <motion.circle cx="60" cy="60" r="52" stroke="#16A34A" strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 327} 327`} initial={{ strokeDasharray: '0 327' }} animate={{ strokeDasharray: `${(score / 100) * 327} 327` }} transition={{ duration: 1 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-bold">{score}</span></div>
          </div>
          <Badge color="green" className="mt-2"><TrendingUp className="h-3 w-3" /> {completed}/{checklist.length} done</Badge>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Check className="h-4 w-4 text-primary-600" /> Google Business Checklist</h3>
          <div className="space-y-2">
            {checklist.map((c) => (
              <button key={c.id} onClick={() => toggleItem(c.id)} className="flex items-center gap-3 py-1.5 w-full text-left">
                <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-colors ${c.done ? 'bg-primary-600 text-white' : 'border border-gray-300 dark:border-zinc-700'}`}>
                  {c.done && <Check className="h-3 w-3" />}
                </div>
                <span className={`text-sm ${c.done ? 'text-gray-500 line-through' : ''}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Search className="h-4 w-4 text-secondary-600" /> Keyword Rankings</h3>
        <p className="text-xs text-gray-500 mb-4">Your position in local Google search</p>
        <div className="space-y-3">
          {keywords.map((k) => (
            <div key={k.kw} className="flex items-center justify-between">
              <span className="text-sm font-medium">{k.kw}</span>
              <div className="flex items-center gap-3">
                <div className="w-40 hidden sm:block"><Progress value={100 - (k.rank * 8)} /></div>
                <span className="text-sm font-bold w-8 text-right">#{k.rank}</span>
                <span className={`text-xs ${k.trend === 'up' ? 'text-primary-600' : 'text-red-500'}`}>{k.trend === 'up' ? '↑' : '↓'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900/20 dark:to-primary-900/20 border-0">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent-500" /> AI SEO Suggestions</h3>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 rounded-xl bg-white dark:bg-zinc-900 p-3">
              <div className="h-7 w-7 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0"><Lightbulb className="h-4 w-4 text-accent-600" /></div>
              <p className="text-sm">{s}</p>
            </motion.div>
          ))}
        </div>
        <Button className="mt-4" onClick={() => toast.success('AI is optimizing your profile')}><Sparkles className="h-4 w-4" /> Apply with AI</Button>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = STAT_ICONS[i % STAT_ICONS.length];
          return (
            <Card key={s.label} className="p-4">
              <Icon className={`h-5 w-5 ${STAT_COLORS[i % STAT_COLORS.length]} mb-2`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
