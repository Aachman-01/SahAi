import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;
    async function complete() {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get('error_description') || params.get('error');
        if (oauthError) throw new Error(oauthError);

        const supabase = getSupabaseClient();
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session?.access_token) throw new Error('Google did not return a valid session. Please try again.');

        await completeGoogleLogin(data.session.access_token);
        if (active) navigate('/dashboard', { replace: true });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Google login could not be completed.');
      }
    }
    complete();
    return () => { active = false; };
  }, [completeGoogleLogin, navigate]);

  if (error) {
    return (
      <main className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 p-8 text-center shadow-soft">
          <LogIn className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-bold">Google sign-in failed</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login', { replace: true })}>Back to login</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center">
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-600" />
        <h1 className="mt-4 text-lg font-semibold">Completing Google sign-in…</h1>
        <p className="mt-1 text-sm text-gray-500">Your SahAI workspace is being prepared.</p>
      </div>
    </main>
  );
}
