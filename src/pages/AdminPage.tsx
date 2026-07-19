import { useState } from 'react';
import { Users, Store, Landmark, TrendingUp, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminVendors, useUpdateVendorStatus, useAdminStats, useAdminSchemes, useAdminReports } from '@/hooks/useApi';
import { formatINR, formatNumber } from '@/utils/format';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const TABS = ['Vendors', 'Analytics', 'Schemes', 'Reports'] as const;
const NEXT_STATUS: Record<string, string> = { active: 'suspended', suspended: 'active', pending: 'active' };

export default function AdminPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Vendors');
  const [q, setQ] = useState('');

  const { data: vendors = [], isLoading: vendorsLoading } = useAdminVendors();
  const { data: stats } = useAdminStats();
  const { data: schemes = [] } = useAdminSchemes();
  const { data: reports = [] } = useAdminReports();
  const updateStatus = useUpdateVendorStatus();

  const growth = stats?.growth || [];

  const statusBadge = (s: string) =>
    s === 'active' ? <Badge color="green"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
    : s === 'pending' ? <Badge color="accent"><Clock className="h-3 w-3" /> Pending</Badge>
    : <Badge color="red"><XCircle className="h-3 w-3" /> Suspended</Badge>;

  const cycleStatus = async (id: string, current: string) => {
    const next = NEXT_STATUS[current] || 'active';
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast.success(`Vendor set to ${next}`);
    } catch { toast.error('Could not update status'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <header className="glass border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-secondary-600 flex items-center justify-center text-white font-bold">A</div>
            <div><p className="font-bold leading-tight">Admin Panel</p><p className="text-xs text-gray-500">SahAI Platform</p></div>
          </div>
          <Badge color="secondary">Administrator</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Vendors" value={stats ? formatNumber(stats.totalVendors) : '—'} icon={<Store className="h-5 w-5" />} color="primary" />
          <StatCard title="Active Users" value={stats ? formatNumber(stats.activeUsers) : '—'} icon={<Users className="h-5 w-5" />} color="secondary" />
          <StatCard title="Schemes Listed" value={stats ? String(stats.schemesListed) : '—'} icon={<Landmark className="h-5 w-5" />} color="accent" />
          <StatCard title="Platform Revenue" value={stats ? formatINR(stats.revenue) : '—'} icon={<TrendingUp className="h-5 w-5" />} color="primary" />
        </div>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Platform Growth</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="admin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2} fill="url(#admin)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium ${tab === t ? 'bg-secondary-600 text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Vendors' && (
          <Card className="p-5">
            <Input placeholder="Search vendors..." value={q} onChange={(e) => setQ(e.target.value)} icon={<Search className="h-4 w-4" />} className="mb-4" />
            {vendorsLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-zinc-800">
                    <tr><th className="pb-3">Vendor</th><th>Owner</th><th>Category</th><th>Location</th><th>Rating</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {vendors.filter((v) => v.name.toLowerCase().includes(q.toLowerCase())).map((v) => (
                      <tr key={v.id} className="border-b border-gray-100 dark:border-zinc-800">
                        <td className="py-3 font-medium">{v.name}</td>
                        <td>{v.owner}</td>
                        <td>{v.category}</td>
                        <td>{v.location}</td>
                        <td><span className="flex items-center gap-1"><span className="text-accent-500">★</span>{v.rating}</span></td>
                        <td>{statusBadge(v.status)}</td>
                        <td><Button size="sm" variant="outline" onClick={() => cycleStatus(v.id, v.status)} disabled={updateStatus.isPending}>{v.status === 'active' ? 'Suspend' : 'Activate'}</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'Schemes' && (
          <div className="grid md:grid-cols-2 gap-4">
            {schemes.map((s) => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div><h3 className="font-bold">{s.name}</h3><p className="text-xs text-gray-500">{s.ministry}</p></div>
                  <Badge color="green">Active</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">{s.benefits}</p>
              </Card>
            ))}
          </div>
        )}

        {tab === 'Analytics' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-6"><h3 className="font-bold mb-3">Vendor Signups</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Area type="monotone" dataKey="sales" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6"><h3 className="font-bold mb-3">QR Scans</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Area type="monotone" dataKey="scans" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 'Reports' && (
          <Card className="p-6">
            <h3 className="font-bold mb-4">User Reports</h3>
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-900">
                  <div><p className="text-sm font-medium">{r.user}</p><p className="text-xs text-gray-500">{r.issue}</p></div>
                  <Badge color={r.status === 'open' ? 'accent' : 'green'}>{r.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
