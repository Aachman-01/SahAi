import axios from 'axios';
import { clearGuestWorkspace, GUEST_SESSION_TOKEN_KEY, GUEST_TOKEN, guestRequest } from '@/lib/guestStore';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'sahai_token';

export const tokenStore = {
  get: () => sessionStorage.getItem(GUEST_SESSION_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY),
  set: (token: string) => {
    if (token === GUEST_TOKEN) {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.setItem(GUEST_SESSION_TOKEN_KEY, token);
    } else {
      clearGuestWorkspace();
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    clearGuestWorkspace();
  },
  isGuest: () => sessionStorage.getItem(GUEST_SESSION_TOKEN_KEY) === GUEST_TOKEN,
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function localResult<T>(method: string, url: string, body?: unknown): Promise<{ handled: boolean; data?: T }> {
  return guestRequest<T>(method, url, body);
}

// Guest requests are resolved in browser sessionStorage. Only read-only vendor
// discovery intentionally falls through to the backend with a stateless token.
export async function get<T>(url: string): Promise<T> {
  const local = await localResult<T>('GET', url);
  if (local.handled) return local.data as T;
  const { data } = await api.get<T>(url);
  return data;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const local = await localResult<T>('POST', url, body);
  if (local.handled) return local.data as T;
  const { data } = await api.post<T>(url, body);
  return data;
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  const local = await localResult<T>('PUT', url, body);
  if (local.handled) return local.data as T;
  const { data } = await api.put<T>(url, body);
  return data;
}
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const local = await localResult<T>('PATCH', url, body);
  if (local.handled) return local.data as T;
  const { data } = await api.patch<T>(url, body);
  return data;
}
export async function del<T>(url: string, body?: unknown): Promise<T> {
  const local = await localResult<T>('DELETE', url, body);
  if (local.handled) return local.data as T;
  const { data } = await api.delete<T>(url, body ? { data: body } : undefined);
  return data;
}

/**
 * Resolve a stored image reference to an absolute URL. Guest images are data
 * URLs and remain in the browser; backend upload paths use the API host.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(url)) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}
