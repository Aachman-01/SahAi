import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet, ShoppingBag, Eye, QrCode, Package, Landmark,
  TrendingUp, ArrowRight, Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDashboard, useProfile } from '@/hooks/useApi';
import { formatINR, formatNumber } from '@/utils/format';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: profile } = useProfile();

  const firstName = (profile?.owner || 'Vendor').split(' ')[0];
  const s = data?.stats;
  const sales = data?.sales || [];

  const stats = s ? [
    { title: "Today's Payments", value: formatINR(s.todaysPayments), delta: 'Live from payments', icon: <Wallet className="h-5 w-5" />, color: 'primary' as const },
    { title: 'Orders', value: s.orders, delta: 'Total transactions', icon: <ShoppingBag className="h-5 w-5" />, color: 'secondary' as const },
    { title: 'Website Visitors', value: formatNumber(s.visitors), delta: 'This month', icon: <Eye className="h-5 w-5" />, color: 'accent' as const },
    { title: 'QR Scans', value: formatNumber(s.qrScans), delta: 'This month', icon: <QrCode className="h-5 w-5" />, color: 'primary' as const },
    { title: 'Product Views', value: formatNumber(s.productViews), delta: 'All products', icon: <Package className="h-5 w-5" />, color: 'secondary' as const },
    { title: 'Govt Schemes', value: s.schemes, delta: 'Available matches', icon: <Landmark className="h-5 w-5" />, color: 'accent' as const },
  ] : [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge color="primary" className="mb-2"><Sparkles className="h-3 w-3" /> AI Active</Badge>
              <h2 className="text-2xl font-bold">Namaste, {firstName} 👋</h2>
              <p className="text-sm text-gray-600 dark:text-zinc-300 mt-1">Your digital business is performing well. Here's today's snapshot.</p>
            </div>
            <Link to="/chat"><Button><Sparkles className="h-4 w-4" /> Talk to AI</Button></Link>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading || !s
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : stats.map((st, i) => (
            <motion.div key={st.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <StatCard {...st} />
            </motion.div>
          ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold">Sales & Visitors</h3><p className="text-xs text-gray-500">Last 7 months</p></div>
            <Badge color="green"><TrendingUp className="h-3 w-3" /> Trending up</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={sales}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16A34A" stopOpacity={0.3} /><stop offset="100%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="#16A34A" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-1">QR Scans</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly breakdown</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="scans" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recent Transactions</h3>
            <Link to="/dashboard/analytics" className="text-xs font-semibold text-primary-600 flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-2">
            {(data?.transactions || []).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.vendor}</p>
                  <p className="text-xs text-gray-500">{t.date} · {t.method}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatINR(t.amount)}</p>
                  <Badge color={t.status === 'success' ? 'green' : t.status === 'pending' ? 'accent' : 'red'}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recommended Schemes</h3>
            <Link to="/dashboard/schemes" className="text-xs font-semibold text-primary-600 flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            {(data?.schemes || []).map((sc) => (
              <div key={sc.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900">
                <div className="h-9 w-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0"><Landmark className="h-4 w-4 text-accent-600" /></div>
                <div>
                  <p className="text-sm font-semibold">{sc.name}</p>
                  <p className="text-xs text-gray-500">{sc.ministry}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
