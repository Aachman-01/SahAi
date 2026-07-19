import { Card, Badge } from '@/components/ui/Card';
import { StatCard } from '@/components/StatCard';
import { Wallet, Eye, QrCode, TrendingUp, Package, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAnalytics } from '@/hooks/useApi';
import { formatINR, formatNumber } from '@/utils/format';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();
  const sales = data?.sales || [];
  const productViews = data?.productViews || [];
  const trafficSources = data?.trafficSources || [];

  const last = sales[sales.length - 1];
  const prev = sales[sales.length - 2];
  const pct = (a?: number, b?: number) => (a && b ? `${Math.round(((a - b) / b) * 100)}%` : '0%');
  const avgOrder = last ? Math.round(last.sales / Math.max(last.scans, 1)) : 0;

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Analytics</h2>
        <p className="text-sm text-gray-500">Track your business performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value={formatINR(last?.sales || 0)} delta={pct(last?.sales, prev?.sales)} icon={<Wallet className="h-5 w-5" />} color="primary" />
        <StatCard title="Visitors" value={formatNumber(last?.visitors || 0)} delta={pct(last?.visitors, prev?.visitors)} icon={<Eye className="h-5 w-5" />} color="secondary" />
        <StatCard title="QR Scans" value={formatNumber(last?.scans || 0)} delta={pct(last?.scans, prev?.scans)} icon={<QrCode className="h-5 w-5" />} color="accent" />
        <StatCard title="Avg Order" value={formatINR(avgOrder)} icon={<TrendingUp className="h-5 w-5" />} color="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-bold mb-1">Revenue & Visitors</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly trend</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sales}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16A34A" stopOpacity={0.3} /><stop offset="100%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="#16A34A" strokeWidth={2} fill="url(#rev)" />
              <Area type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-1">QR Scans</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly</p>
          <ResponsiveContainer width="100%" height={280}>
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

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="font-bold mb-1 flex items-center gap-2"><Package className="h-4 w-4 text-primary-600" /> Popular Products</h3>
          <p className="text-xs text-gray-500 mb-4">By views</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productViews} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={70} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="views" fill="#16A34A" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-1">Traffic Sources</h3>
          <p className="text-xs text-gray-500 mb-4">Where visitors come from</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={trafficSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {trafficSources.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-1 flex items-center gap-2"><Users className="h-4 w-4 text-secondary-600" /> Customer Growth</h3>
          <p className="text-xs text-gray-500 mb-4">Cumulative customers</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Website Views</h3>
          <Badge color="green"><TrendingUp className="h-3 w-3" /> Growing</Badge>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={sales}>
            <defs>
              <linearGradient id="views" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Area type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2} fill="url(#views)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
