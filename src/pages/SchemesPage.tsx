import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Bookmark, BookmarkCheck, CheckCircle2, FileText, ExternalLink, Landmark, Filter } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSchemes, useBookmarkScheme } from '@/hooks/useApi';
import toast from 'react-hot-toast';

export default function SchemesPage() {
  const { data: schemes = [], isLoading } = useSchemes();
  const bookmarkMut = useBookmarkScheme();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');

  const cats = ['All', ...Array.from(new Set(schemes.map((s) => s.category)))];
  const filtered = schemes.filter((s) =>
    (filter === 'All' || s.category === filter) && s.name.toLowerCase().includes(q.toLowerCase())
  );

  const toggleBookmark = async (id: string, current: boolean) => {
    try {
      await bookmarkMut.mutateAsync({ id, bookmarked: !current });
      toast.success(!current ? 'Bookmarked' : 'Bookmark removed');
    } catch {
      toast.error('Could not update bookmark');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Government Schemes</h2>
        <p className="text-sm text-gray-500">AI-matched schemes you may be eligible for</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search schemes..." value={q} onChange={(e) => setQ(e.target.value)} icon={<Search className="h-4 w-4" />} className="flex-1" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {cats.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${filter === c ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Filter className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="font-semibold">No schemes found</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center"><Landmark className="h-5 w-5 text-accent-600" /></div>
                    <div>
                      <h3 className="font-bold">{s.name}</h3>
                      <p className="text-xs text-gray-500">{s.ministry}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleBookmark(s.id, !!s.bookmarked)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                    {s.bookmarked ? <BookmarkCheck className="h-5 w-5 text-primary-600" /> : <Bookmark className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>

                <Badge color="accent" className="self-start mb-3">{s.category}</Badge>

                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">{s.benefits}</p>

                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary-600" /> Eligibility</p>
                  <ul className="space-y-1">
                    {s.eligibility.map((e) => <li key={e} className="text-xs text-gray-600 dark:text-zinc-400 flex items-start gap-1.5"><span className="text-primary-500 mt-0.5">•</span>{e}</li>)}
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><FileText className="h-3 w-3 text-secondary-600" /> Documents Required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.documents.map((d) => <Badge key={d} color="gray">{d}</Badge>)}
                  </div>
                </div>

                <div className="mt-auto flex gap-2">
                  <Button className="flex-1" onClick={() => window.open(s.applyUrl, '_blank')}>Apply Now</Button>
                  <Button variant="outline" onClick={() => window.open(s.applyUrl, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
