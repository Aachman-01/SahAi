import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, Shield, User, Chrome, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

type Tab = 'phone' | 'vendor' | 'admin';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  // Email + password (real DB auth) state.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { loginWith, signup, sendOtp: requestOtp, loginWithGoogle, loginAsGuest } = useAuth();
  const nav = useNavigate();

  const submitEmail = async (role: 'vendor' | 'admin', to: string) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error('Enter a valid email address'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (mode === 'signup' && !name.trim()) { toast.error('Please enter your name'); return; }
    try {
      setBusy(true);
      if (mode === 'signup') {
        await signup({ name: name.trim(), email, password, role });
        toast.success('Account created! Welcome to SahAI');
      } else {
        await loginWith({ email, password });
        toast.success('Signed in');
      }
      nav(to);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Authentication failed. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) { toast.error('Enter a valid phone number'); return; }
    try {
      setBusy(true);
      await requestOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent! Use 1234 for demo.');
    } catch {
      toast.error('Could not send OTP. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setBusy(true);
      await loginWith({ role: 'vendor', phone, otp });
      toast.success('Welcome to SahAI!');
      nav('/chat');
    } catch {
      toast.error('Invalid OTP. Use 1234');
    } finally {
      setBusy(false);
    }
  };

  const startGoogleLogin = async () => {
    try {
      setBusy(true);
      await loginWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google login could not be started');
      setBusy(false);
    }
  };

  const continueAsGuest = async () => {
    try {
      setBusy(true);
      await loginAsGuest();
      toast.success('Local guest session started — nothing will be saved to the database');
      nav('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Guest login failed');
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Phone }[] = [
    { id: 'phone', label: 'Phone OTP', icon: Phone },
    { id: 'vendor', label: 'Vendor', icon: User },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      {/* Left brand panel */}
      <div className="hidden lg:flex relative gradient-primary p-12 flex-col justify-between text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"><Zap className="h-5 w-5" /></div>
            <span className="text-xl font-bold">SahAI</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">Empowering every street vendor digitally.</h2>
          <p className="mt-4 text-white/90 max-w-md">AI-powered business profile, UPI QR, mini website, marketing kit & government scheme recommendations — in minutes.</p>
          <div className="mt-8 flex gap-6 text-sm">
            <div><p className="text-2xl font-bold">20M+</p><p className="text-white/80">Vendors</p></div>
            <div><p className="text-2xl font-bold">2</p><p className="text-white/80">Languages</p></div>
            <div><p className="text-2xl font-bold">100%</p><p className="text-white/80">Free</p></div>
          </div>
        </div>
        <p className="relative text-xs text-white/70">Final Year B.Tech Project · 2025</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-zinc-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center"><Zap className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold">SahAI</span>
          </div>

          <h1 className="text-2xl font-bold">{tab !== 'phone' && mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-gray-500">{tab !== 'phone' && mode === 'signup' ? 'Sign up to get started with SahAI' : 'Sign in to continue to your dashboard'}</p>

          <div className="mt-6 grid grid-cols-3 gap-2 p-1 rounded-xl bg-gray-100 dark:bg-zinc-900">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${tab === t.id ? 'bg-white dark:bg-zinc-800 shadow-soft text-primary-700 dark:text-primary-400' : 'text-gray-500'}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {tab === 'phone' && (
              <>
                <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone className="h-4 w-4" />} />
                {otpSent && <Input label="Enter OTP" placeholder="1234" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} />}
                {!otpSent ? (
                  <Button className="w-full" onClick={sendOtp} disabled={busy}>Send OTP</Button>
                ) : (
                  <Button className="w-full" onClick={verifyOtp} disabled={busy}>Verify & Continue <ArrowRight className="h-4 w-4" /></Button>
                )}
              </>
            )}
            {tab === 'vendor' && (
              <>
                {mode === 'signup' && (
                  <Input label="Full name" placeholder="Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} icon={<User className="h-4 w-4" />} />
                )}
                <Input label="Email" placeholder="vendor@sahai.in" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="h-4 w-4" />} />
                <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button className="w-full" onClick={() => submitEmail('vendor', '/dashboard')} disabled={busy}>
                  {mode === 'signup' ? 'Create account' : 'Vendor Login'} <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-sm text-gray-500">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button" className="font-medium text-primary-600 hover:underline" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </>
            )}
            {tab === 'admin' && (
              <>
                {mode === 'signup' && (
                  <Input label="Full name" placeholder="Admin name" value={name} onChange={(e) => setName(e.target.value)} icon={<User className="h-4 w-4" />} />
                )}
                <Input label="Admin email" placeholder="admin@sahai.in" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="h-4 w-4" />} />
                <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button variant="secondary" className="w-full" onClick={() => submitEmail('admin', '/admin')} disabled={busy}>
                  {mode === 'signup' ? 'Create admin account' : 'Admin Login'} <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-sm text-gray-500">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button" className="font-medium text-primary-600 hover:underline" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </>
            )}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" /> OR <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={startGoogleLogin} disabled={busy}>
              <Chrome className="h-4 w-4" /> Google
            </Button>
            <Button variant="outline" onClick={continueAsGuest} disabled={busy}>
              <Sparkles className="h-4 w-4" /> Local Guest
            </Button>
          </div>
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          You can try the features as a guest.
          </p>

          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
