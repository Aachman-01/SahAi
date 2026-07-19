import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, User, Package, QrCode, Globe, Megaphone,
  Search, Landmark, BarChart3, Settings, Bell, LogOut, Zap, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useApi';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/profile', label: 'Business Profile', icon: User },
  { to: '/dashboard/products', label: 'Products', icon: Package },
  { to: '/dashboard/qr', label: 'QR Payment', icon: QrCode },
  { to: '/dashboard/website', label: 'Website Builder', icon: Globe },
  { to: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/dashboard/seo', label: 'Local SEO', icon: Search },
  { to: '/dashboard/schemes', label: 'Govt Schemes', icon: Landmark },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const nav = useNavigate();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 border-r border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100 dark:border-zinc-800">
          <button onClick={() => nav('/dashboard')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">SahAI</span>
          </button>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] no-scrollbar">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
                }`
              }
            >
              <it.icon className="h-4.5 w-4.5" />
              {it.label}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
            <button onClick={() => nav('/dashboard/notifications')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900">
              <Bell className="h-4.5 w-4.5" /> Notifications
              {unreadCount > 0 && (
                <span className="ml-auto min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                {user?.name?.[0] ?? 'V'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name ?? 'Vendor'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={() => { logout(); nav('/'); }} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
