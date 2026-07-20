import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useApi';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  const titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/profile': 'Business Profile',
    '/dashboard/products': 'Products',
    '/dashboard/qr': 'QR Payment',
    '/dashboard/website': 'Website Builder',
    '/dashboard/marketing': 'Marketing Kit',
    '/dashboard/business-card': 'Business Card',
    '/dashboard/schemes': 'Government Schemes',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/settings': 'Settings',
    '/dashboard/notifications': 'Notifications',
  };
  const title = titleMap[loc.pathname] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="flex">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 glass border-b border-gray-100/50 dark:border-zinc-800/50">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setOpen(true)} className="lg:hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <Menu className="h-5 w-5" />
                </button>
                <motion.h1 key={title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="text-lg font-bold tracking-tight">{title}</motion.h1>
              </div>
              <div className="flex items-center gap-2">
                <CommandPalette />
                <button
                  onClick={() => nav('/dashboard/notifications')}
                  aria-label="Notifications"
                  title="Notifications"
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                <button onClick={toggle} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                  {user?.name?.[0] ?? 'V'}
                </div>
              </div>
            </div>
          </header>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
