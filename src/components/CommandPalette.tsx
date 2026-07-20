import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight } from 'lucide-react';

const COMMANDS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Business Profile', to: '/dashboard/profile' },
  { label: 'Products', to: '/dashboard/products' },
  { label: 'QR Payment', to: '/dashboard/qr' },
  { label: 'Website Builder', to: '/dashboard/website' },
  { label: 'Marketing Kit', to: '/dashboard/marketing' },
  { label: 'Business Card', to: '/dashboard/business-card' },
  { label: 'Govt Schemes', to: '/dashboard/schemes' },
  { label: 'Analytics', to: '/dashboard/analytics' },
  { label: 'Settings', to: '/dashboard/settings' },
  { label: 'Customer Website', to: '/customer/my-shop' },
  { label: 'Admin Panel', to: '/admin' },
  { label: 'AI Chat', to: '/chat' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const results = COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-gray-400 hover:border-primary-400 transition-colors">
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 dark:border-zinc-700 px-1 text-[10px]">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 shadow-float border border-gray-100 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 px-4">
                <Search className="h-5 w-5 text-gray-400" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent py-4 text-sm outline-none" />
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-gray-400">No results found.</p>}
                {results.map((c) => (
                  <button key={c.to} onClick={() => { nav(c.to); setOpen(false); setQ(''); }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800">
                    {c.label}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
