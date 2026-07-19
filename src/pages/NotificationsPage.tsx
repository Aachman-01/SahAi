import { motion } from 'framer-motion';
import { Check, Wallet, Star, Landmark, Megaphone, Bell, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications, useMarkNotification, useMarkAllNotifications, useDeleteNotification } from '@/hooks/useApi';
import toast from 'react-hot-toast';

const ICONS: Record<string, { icon: typeof Wallet; color: string }> = {
  payment: { icon: Wallet, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' },
  review: { icon: Star, color: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600' },
  scheme: { icon: Landmark, color: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600' },
  marketing: { icon: Megaphone, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' },
  info: { icon: Bell, color: 'bg-gray-100 dark:bg-zinc-800 text-gray-500' },
};

export default function NotificationsPage() {
  const { data: notifs = [], isLoading } = useNotifications();
  const markMut = useMarkNotification();
  const markAllMut = useMarkAllNotifications();
  const deleteMut = useDeleteNotification();

  const unread = notifs.filter((n) => !n.read).length;

  const markAll = async () => {
    try { await markAllMut.mutateAsync(); toast.success('All marked read'); }
    catch { toast.error('Could not update'); }
  };
  const remove = async (id: string) => {
    try { await deleteMut.mutateAsync(id); toast.success('Deleted'); }
    catch { toast.error('Could not delete'); }
  };
  const markRead = async (id: string, read: boolean) => {
    if (read) return;
    try { await markMut.mutateAsync({ id, read: true }); } catch { /* noop */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          <p className="text-sm text-gray-500">{unread} unread notification{unread === 1 ? '' : 's'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAll} disabled={markAllMut.isPending}><Check className="h-4 w-4" /> Mark all read</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : notifs.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="font-semibold">You're all caught up</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((n, i) => {
            const { icon: Icon, color } = ICONS[n.type] || ICONS.info;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`p-4 flex items-center gap-4 cursor-pointer ${!n.read ? 'border-primary-200 dark:border-primary-900/40' : ''}`} onClick={() => markRead(n.id, n.read)}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">{n.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(n.id); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"><Trash2 className="h-4 w-4" /></button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
