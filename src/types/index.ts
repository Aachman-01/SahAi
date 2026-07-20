export type Role = 'vendor' | 'admin' | 'guest';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  avatar?: string;
}

export interface Vendor {
  id: string;
  name: string;
  owner: string;
  phone: string;
  upiId: string;
  category: string;
  location: string;
  hours: string;
  logo?: string;
  photo?: string;
  rating: number;
  joinedAt: string;
  status: 'active' | 'pending' | 'suspended';
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  offerPrice?: number;
  stock: number;
  available: boolean;
  description: string;
  image: string;
  popular?: boolean;
  discount?: number;
}

export interface Transaction {
  id: string;
  vendor: string;
  amount: number;
  method: 'UPI' | 'Cash' | 'Card';
  status: 'success' | 'pending' | 'failed';
  date: string;
}

export interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: string;
  eligibility: string[];
  documents: string[];
  benefits: string;
  applyUrl: string;
  bookmarked?: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface NotificationPrefs {
  payments: boolean;
  reviews: boolean;
  schemes: boolean;
  marketing: boolean;
}

export interface Settings {
  theme: string;
  language: string;
  notifications: NotificationPrefs;
  upiId: string;
  linkedBank: string;
}

export interface QrConfig {
  upiId: string;
  name: string;
  phone: string;
  color: string;
  sound: boolean;
}

export interface WebsiteConfig {
  template: string;
  published: boolean;
  slug: string;
}

export interface SalesPoint { month: string; sales: number; visitors: number; scans: number; }
export interface ProductView { name: string; views: number; }
export interface TrafficSource { name: string; value: number; color: string; }
export interface Analytics {
  sales: SalesPoint[];
  productViews: ProductView[];
  trafficSources: TrafficSource[];
}

export interface BusinessCardConfig {
  template: 'modern' | 'classic' | 'minimal';
  orientation: 'landscape' | 'portrait';
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  tagline: string;
  showPhoto: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showUpi: boolean;
  showLocation: boolean;
  showHours: boolean;
  showDescription: boolean;
  showQr: boolean;
  updatedAt?: string | null;
}

export interface DashboardData {
  stats: {
    todaysPayments: number;
    orders: number;
    visitors: number;
    qrScans: number;
    productViews: number;
    schemes: number;
    products: number;
  };
  sales: SalesPoint[];
  transactions: Transaction[];
  schemes: Scheme[];
}

export interface AdminStats {
  totalVendors: number;
  activeUsers: number;
  schemesListed: number;
  revenue: number;
  growth: SalesPoint[];
}

export interface Report { id: string; user: string; issue: string; status: string; }

export interface MarketingMaterial {
  id: string;
  label: string;
  icon: string;
  color: string;
  size: string;
}
