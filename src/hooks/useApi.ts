import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, patch, del } from '@/lib/api';
import type {
  Product, Transaction, Scheme, Review, Vendor, Settings, QrConfig,
  WebsiteConfig, Analytics, BusinessCardConfig, DashboardData, Notification,
  AdminStats, Report, MarketingMaterial,
} from '@/types';

/* ---------------- Profile ---------------- */
export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => get<Vendor>('/api/profile') });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Vendor>) => put<Vendor>('/api/profile', body),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Shared fields (UPI ID, name, phone) also live on the QR page.
      qc.invalidateQueries({ queryKey: ['qr'] });
    },
  });
};

/* ---- Business profile: single source of truth for the fields shared by the
   Business Profile and QR Payment pages (UPI ID, Business Name, Phone). ---- */
export interface BusinessProfileData {
  businessName: string;
  name: string;
  upiId: string;
  phone: string;
  updatedAt: string | null;
  conflict: boolean;
  previousUpdatedAt?: string | null;
}

export interface BusinessProfilePatch {
  businessName?: string;
  upiId?: string;
  phone?: string;
  baseUpdatedAt?: string | null;
}

// React Query's shared cache is the frontend source of truth used by both forms.
export const useBusinessProfile = () =>
  useQuery({
    queryKey: ['business-profile'],
    queryFn: () => get<BusinessProfileData>('/api/business-profile'),
  });

export const useUpdateBusinessProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BusinessProfilePatch) =>
      patch<BusinessProfileData>('/api/business-profile', body),
    onSuccess: (data) => {
      // Update the shared store immediately before background refreshes.
      qc.setQueryData(['business-profile'], data);
      qc.setQueryData<Vendor>(['profile'], (old) => old ? {
        ...old, name: data.businessName, upiId: data.upiId, phone: data.phone,
      } : old);
      qc.setQueryData<QrConfig>(['qr'], (old) => old ? {
        ...old, name: data.businessName, upiId: data.upiId, phone: data.phone,
      } : old);
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['qr'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/* ---------------- Products ---------------- */
export const useProducts = () =>
  useQuery({ queryKey: ['products'], queryFn: () => get<Product[]>('/api/products') });

export const useAddProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<Product>) => post<Product>('/api/products', p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Product> }) =>
      put<Product>(`/api/products/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/api/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/* ---------------- Transactions ---------------- */
export const useTransactions = () =>
  useQuery({ queryKey: ['transactions'], queryFn: () => get<Transaction[]>('/api/transactions') });

export const useAddTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: Partial<Transaction>) => post<Transaction>('/api/transactions', t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/* ---------------- Schemes ---------------- */
export const useSchemes = () =>
  useQuery({ queryKey: ['schemes'], queryFn: () => get<Scheme[]>('/api/schemes') });

export const useBookmarkScheme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      post(`/api/schemes/${id}/bookmark`, { bookmarked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schemes'] }),
  });
};

/* ---------------- Reviews ---------------- */
export const useReviews = () =>
  useQuery({ queryKey: ['reviews'], queryFn: () => get<Review[]>('/api/reviews') });

/* ---------------- Analytics + Dashboard ---------------- */
export const useAnalytics = () =>
  useQuery({ queryKey: ['analytics'], queryFn: () => get<Analytics>('/api/analytics') });

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => get<DashboardData>('/api/dashboard') });

/* ---------------- Settings ---------------- */
export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: () => get<Settings>('/api/settings') });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => put<Settings>('/api/settings', patch),
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  });
};

/* ---------------- QR ---------------- */
export const useQr = () =>
  useQuery({ queryKey: ['qr'], queryFn: () => get<QrConfig>('/api/qr') });

export const useUpdateQr = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<QrConfig>) => put<QrConfig>('/api/qr', body),
    onSuccess: (data) => {
      qc.setQueryData(['qr'], data);
      // Shared fields may have changed the vendor record too.
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

/* ---------------- Website ---------------- */
export const useWebsite = () =>
  useQuery({ queryKey: ['website'], queryFn: () => get<WebsiteConfig>('/api/website') });

export const useUpdateWebsite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<WebsiteConfig>) => put<WebsiteConfig>('/api/website', patch),
    onSuccess: (data) => qc.setQueryData(['website'], data),
  });
};

/* ---------------- Business Card ---------------- */
export const useBusinessCard = () =>
  useQuery({ queryKey: ['business-card'], queryFn: () => get<BusinessCardConfig>('/api/business-card') });

export const useUpdateBusinessCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: BusinessCardConfig) => put<BusinessCardConfig>('/api/business-card', config),
    onSuccess: (data) => qc.setQueryData(['business-card'], data),
  });
};

/* ---------------- Marketing ---------------- */
export const useMarketing = () =>
  useQuery({ queryKey: ['marketing'], queryFn: () => get<MarketingMaterial[]>('/api/marketing') });

/* ---------------- Notifications ---------------- */
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => get<Notification[]>('/api/notifications') });

export const useMarkNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => put(`/api/notifications/${id}`, { read }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post('/api/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/api/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

/* ---------------- Admin ---------------- */
export const useAdminVendors = () =>
  useQuery({ queryKey: ['admin', 'vendors'], queryFn: () => get<Vendor[]>('/api/admin/vendors') });

export const useUpdateVendorStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      put<Vendor>(`/api/admin/vendors/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'vendors'] }),
  });
};

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin', 'stats'], queryFn: () => get<AdminStats>('/api/admin/stats') });

export const useAdminSchemes = () =>
  useQuery({ queryKey: ['admin', 'schemes'], queryFn: () => get<Scheme[]>('/api/admin/schemes') });

export const useAdminReports = () =>
  useQuery({ queryKey: ['admin', 'reports'], queryFn: () => get<Report[]>('/api/admin/reports') });

/* ---------------- Gallery ---------------- */
export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  sortOrder?: number;
  createdAt?: string;
}

export const useGallery = () =>
  useQuery({ queryKey: ['gallery'], queryFn: () => get<GalleryImage[]>('/api/gallery') });

export const useAddGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { url: string; caption?: string }) =>
      post<GalleryImage>('/api/gallery', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
};

export const useUpdateGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<GalleryImage> }) =>
      put<GalleryImage>(`/api/gallery/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
};

export const useDeleteGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/api/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
};

/* ---------------- Profile picture (avatar) helpers ---------------- */
export const useRemoveProfilePicture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => del<Vendor>('/api/profile/picture'),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
