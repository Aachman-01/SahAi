import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './ui/Button';

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const links = [
    { label: 'Features', to: '/#features' },
    { label: 'How it Works', to: '/#how' },
    { label: 'Schemes', to: '/#schemes' },
    { label: 'Pricing', to: '/#pricing' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-gray-100/50 dark:border-zinc-800/50">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-soft">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">SahAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a key={l.label} href={l.to} className="text-sm font-medium text-gray-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => nav('/login')}>Login</Button>
            <Button size="sm" onClick={() => nav('/login')}>Get Started</Button>

            <button onClick={() => setOpen((v) => !v)} className="md:hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="md:hidden overflow-hidden border-t border-gray-100 dark:border-zinc-800">
              <div className="px-4 py-3 space-y-1">
                {links.map((l) => (
                  <a key={l.label} href={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800">{l.label}</a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
