import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'sahai_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap axios responses so callers get data directly.
export async function get<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url);
  return data;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(url, body);
  return data;
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<T>(url, body);
  return data;
}
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, body);
  return data;
}
export async function del<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.delete<T>(url, body ? { data: body } : undefined);
  return data;
}

/**
 * Resolve a stored image reference to an absolute URL. Relative paths returned
 * by the backend (e.g. `/uploads/img_xxx.jpg`) are prefixed with the API host so
 * they render correctly in any environment.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(url)) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}
