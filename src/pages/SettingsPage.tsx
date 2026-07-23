import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Moon, Sun, Bell, Globe, Lock, CreditCard, Database, Save, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES } from '@/data/languages';
import { useSettings, useUpdateSettings, useBusinessProfile, useUpdateBusinessProfile } from '@/hooks/useApi';
import { validateBusinessProfile, formatBusinessUpdatedAt, type BusinessFieldErrors } from '@/utils/validation';
import type { NotificationPrefs } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const NOTIF_ROWS: [keyof NotificationPrefs, string, string][] = [
  ['payments', 'Payment Alerts', 'Get notified on every UPI payment'],
  ['reviews', 'New Reviews', 'When a customer leaves a review'],
  ['schemes', 'Scheme Updates', 'New government scheme matches'],
  ['marketing', 'Marketing Tips', 'Weekly AI marketing suggestions'],
];

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLanguage();
  const { data: settings } = useSettings();
  const { data: businessProfile } = useBusinessProfile();
  const updateSettings = useUpdateSettings();
  const updateBusinessProfile = useUpdateBusinessProfile();
  const { user, deleteAccount } = useAuth();
  const isGuest = user?.role === 'guest';
  const navigate = useNavigate();

  const [notif, setNotif] = useState<NotificationPrefs>({ payments: true, reviews: true, schemes: false, marketing: true });
  const [upiId, setUpiId] = useState('');
  const [linkedBank, setLinkedBank] = useState('');
  const [errors, setErrors] = useState<BusinessFieldErrors>({});
  const [conflictWarning, setConflictWarning] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (settings) {
      setNotif(settings.notifications);
      setLinkedBank(settings.linkedBank);
      if (settings.language && settings.language !== lang) setLang(settings.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // UPI ID uses the same shared source as Business Profile and QR Payment.
  useEffect(() => {
    if (businessProfile) setUpiId(businessProfile.upiId);
  }, [businessProfile]);

  const toggleNotif = async (key: keyof NotificationPrefs) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    try { await updateSettings.mutateAsync({ notifications: next }); } catch { toast.error('Could not save'); }
  };

  const chooseLanguage = async (code: string, name: string) => {
    setLang(code);
    try { await updateSettings.mutateAsync({ language: code }); toast.success(`Language: ${name}`); }
    catch { toast.error('Could not save language'); }
  };

  const saving = updateSettings.isPending || updateBusinessProfile.isPending;

  const saveAll = async () => {
    const nextErrors = validateBusinessProfile({ upiId });
    if (nextErrors.upiId) {
      setErrors(nextErrors);
      toast.error('Please enter a valid UPI ID');
      return;
    }
    setErrors({});
    try {
      const saved = await updateBusinessProfile.mutateAsync({
        upiId,
        baseUpdatedAt: businessProfile?.updatedAt ?? null,
      });
      setConflictWarning(saved.conflict ? 'Another device updated these details after this page loaded. Your latest UPI ID was applied.' : '');
      await updateSettings.mutateAsync({ notifications: notif, linkedBank, language: lang, theme });
      toast.success('All settings saved!');
    } catch (err: any) {
      const fields = err?.response?.data?.fields as BusinessFieldErrors | undefined;
      if (fields) setErrors(fields);
      toast.error(err?.response?.data?.error || 'Could not save settings');
    }
  };

  const permanentlyDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      toast.success(isGuest ? 'Local guest data cleared' : 'Your account and associated data were permanently deleted');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not delete account');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${on ? 'bg-primary-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );

  const ToggleRow = ({ title, desc, on, onClick }: { title: string; desc: string; on: boolean; onClick: () => void }) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <Toggle on={on} onClick={onClick} label={title} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance</h3>
        <ToggleRow
          title="Dark Mode"
          desc="Switch between light and dark themes"
          on={theme === 'dark'}
          onClick={() => { toggle(); updateSettings.mutate({ theme: theme === 'dark' ? 'light' : 'dark' }); }}
        />
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Globe className="h-4 w-4" /> Language</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => chooseLanguage(l.code, l.name)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors ${lang === l.code ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-zinc-800 hover:border-primary-300'}`}>
              <span>{l.flag}</span><span className="font-medium">{l.native}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</h3>
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {NOTIF_ROWS.map(([key, title, desc]) => (
            <ToggleRow key={key} title={title} desc={desc} on={notif[key]} onClick={() => toggleNotif(key)} />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-bold flex items-center gap-2"><CreditCard className="h-4 w-4" /> UPI Settings</h3>
          <p className="text-right text-xs text-gray-400">Last updated: {formatBusinessUpdatedAt(businessProfile?.updatedAt)}</p>
        </div>
        {conflictWarning && (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">{conflictWarning}</p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="UPI ID"
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value);
              if (errors.upiId) setErrors((prev) => ({ ...prev, upiId: undefined }));
            }}
            error={errors.upiId}
          />
          <Input label="Linked Bank" value={linkedBank} onChange={(e) => setLinkedBank(e.target.value)} />
        </div>
        <p className="mt-3 text-xs text-gray-500">UPI ID is synchronized with Business Profile and QR Payment.</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="h-4 w-4" /> Security</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Input label="Confirm Password" type="password" placeholder="••••••••" />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Database className="h-4 w-4" /> Data & Backup</h3>
        {isGuest && (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            This is a temporary browser session. Guest profiles, products, images and settings are never uploaded or written to the database. Logging out or closing the browser session clears them.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {!isGuest && <Button variant="outline" onClick={() => toast.success('Backup downloaded')}><Database className="h-4 w-4" /> Download Backup</Button>}
          {!isGuest && <Button variant="outline" onClick={() => toast.success('Restoring...')}><Save className="h-4 w-4" /> Restore</Button>}
          <Button variant="danger" onClick={() => setDeleteOpen(true)} disabled={deleting}><Trash2 className="h-4 w-4" /> {isGuest ? 'Clear Guest Data' : 'Delete Account'}</Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving || deleting}><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All Changes'}</Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={permanentlyDeleteAccount}
        title={isGuest ? 'Clear local guest data?' : 'Permanently delete account?'}
        message={isGuest ? 'This clears the temporary guest profile, products, images and settings stored in this browser session. No database account exists for this guest.' : 'This permanently deletes your email, business profile, products, transactions, reviews, settings, website data, notifications, gallery, uploaded Cloudinary images, and login sessions. This cannot be undone.'}
        confirmLabel={isGuest ? 'Clear guest data' : 'Delete account permanently'}
        loading={deleting}
        tone="danger"
      />
    </div>
  );
}
