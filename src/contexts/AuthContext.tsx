import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { post, get, del, tokenStore } from '@/lib/api';
import { getSupabaseClient, hasSupabaseConfig } from '@/lib/supabase';

interface LoginArgs { role?: Role; name?: string; phone?: string; otp?: string; email?: string; password?: string }
interface SignupArgs { name: string; email: string; password: string; role?: Role }

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (role: Role, name?: string) => Promise<User>;
  loginWith: (args: LoginArgs) => Promise<User>;
  signup: (args: SignupArgs) => Promise<User>;
  sendOtp: (phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleLogin: (accessToken: string) => Promise<User>;
  loginAsGuest: () => Promise<User>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
}
const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from the backend using the stored token.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }
    get<User>('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const loginWith = async (args: LoginArgs): Promise<User> => {
    const { token, user: u } = await post<{ token: string; user: User }>('/api/auth/login', args);
    tokenStore.set(token);
    setUser(u);
    return u;
  };

  const login = (role: Role, name?: string) => loginWith({ role, name });

  const signup = async (args: SignupArgs): Promise<User> => {
    const { token, user: u } = await post<{ token: string; user: User }>('/api/auth/signup', args);
    tokenStore.set(token);
    setUser(u);
    return u;
  };

  const sendOtp = async (phone: string) => {
    await post('/api/auth/otp/send', { phone });
  };

  const loginWithGoogle = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  };

  const completeGoogleLogin = useCallback(async (accessToken: string): Promise<User> => {
    const { token, user: u } = await post<{ token: string; user: User }>('/api/auth/google', { accessToken });
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const loginAsGuest = async (): Promise<User> => {
    const { token, user: u } = await post<{ token: string; user: User }>('/api/auth/guest');
    tokenStore.set(token);
    setUser(u);
    return u;
  };

  const deleteAccount = async () => {
    await del('/api/account', { confirm: 'DELETE' });
    tokenStore.clear();
    setUser(null);
    if (hasSupabaseConfig()) await getSupabaseClient().auth.signOut().catch(() => {});
  };

  const logout = () => {
    post('/api/auth/logout').catch(() => {});
    tokenStore.clear();
    setUser(null);
    if (hasSupabaseConfig()) getSupabaseClient().auth.signOut().catch(() => {});
  };

  return (
    <Ctx.Provider value={{ user, loading, login, loginWith, signup, sendOtp, loginWithGoogle, completeGoogleLogin, loginAsGuest, deleteAccount, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
