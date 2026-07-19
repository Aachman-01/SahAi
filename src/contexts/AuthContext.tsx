import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { post, get, tokenStore } from '@/lib/api';

interface LoginArgs { role?: Role; name?: string; phone?: string; otp?: string; email?: string; password?: string }
interface SignupArgs { name: string; email: string; password: string; role?: Role }

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (role: Role, name?: string) => Promise<User>;
  loginWith: (args: LoginArgs) => Promise<User>;
  signup: (args: SignupArgs) => Promise<User>;
  sendOtp: (phone: string) => Promise<void>;
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

  const logout = () => {
    post('/api/auth/logout').catch(() => {});
    tokenStore.clear();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, loginWith, signup, sendOtp, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
