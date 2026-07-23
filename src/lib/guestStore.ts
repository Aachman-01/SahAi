import type {
  Analytics, BusinessCardConfig, DashboardData, MarketingMaterial, Notification,
  Product, QrConfig, Review, Scheme, Settings, Transaction, User, Vendor, WebsiteConfig,
} from '@/types';

export const GUEST_TOKEN = 'sahai-local-guest-v1';
export const GUEST_SESSION_TOKEN_KEY = 'sahai_guest_session_token';
const WORKSPACE_KEY = 'sahai_guest_workspace_v1';

export const LOCAL_GUEST_USER: User = {
  id: 'local_guest',
  name: 'Guest',
  phone: '',
  role: 'guest',
};

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  sortOrder?: number;
  createdAt?: string;
}

interface GuestWorkspace {
  profile: Vendor;
  products: Product[];
  transactions: Transaction[];
  reviews: Review[];
  settings: Settings;
  qr: QrConfig;
  website: WebsiteConfig;
  businessCard: BusinessCardConfig;
  notifications: Notification[];
  gallery: GalleryImage[];
  bookmarks: string[];
  businessProfileUpdatedAt: string | null;
}

const SCHEMES: Scheme[] = [
  { id: 's1', name: 'PM SVANidhi', ministry: 'Ministry of Housing & Urban Affairs', category: 'Micro Credit', eligibility: ['Street vendor with valid certificate', 'Urban areas', 'No prior loan default'], documents: ['Vending certificate', 'Aadhaar', 'Bank passbook', 'Photo'], benefits: 'Working capital loan up to ₹10,000 with 7% interest subsidy.', applyUrl: 'https://pmsvanidhi.mohua.gov.in/' },
  { id: 's2', name: 'PMMY (Mudra Loan)', ministry: 'Ministry of Finance', category: 'Business Loan', eligibility: ['Non-corporate small business', 'Income generating activity'], documents: ['Aadhaar', 'PAN', 'Business plan', 'Bank statement'], benefits: 'Loan up to ₹10 lakh under Shishu, Kishore and Tarun categories.', applyUrl: 'https://www.mudra.org.in/' },
  { id: 's3', name: 'MSME Udyam Registration', ministry: 'Ministry of MSME', category: 'Registration', eligibility: ['Eligible micro, small or medium enterprise'], documents: ['Aadhaar', 'PAN'], benefits: 'Access to subsidies, credit support and delayed-payment protection.', applyUrl: 'https://udyamregistration.gov.in/' },
  { id: 's4', name: 'Stand-Up India', ministry: 'Ministry of Finance', category: 'Loan', eligibility: ['SC/ST/Women entrepreneurs', 'First-time borrower'], documents: ['Aadhaar', 'PAN', 'Project report'], benefits: 'Bank loans between ₹10 lakh and ₹1 crore for greenfield enterprises.', applyUrl: 'https://www.standupmitra.in/' },
  { id: 's5', name: 'PM Vishwakarma Yojana', ministry: 'Ministry of MSME', category: 'Artisan', eligibility: ['Traditional artisans and craftspeople', 'Self-employed'], documents: ['Aadhaar', 'Mobile', 'Bank details'], benefits: 'Collateral-free credit, toolkit support and training.', applyUrl: 'https://pmvishwakarma.gov.in/' },
  { id: 's6', name: 'National Urban Livelihoods Mission', ministry: 'Ministry of Housing & Urban Affairs', category: 'Livelihood', eligibility: ['Urban poor', 'Vendors', 'Homeless'], documents: ['Aadhaar', 'Address proof'], benefits: 'Skill training, shelter and credit access.', applyUrl: 'https://nulm.gov.in/' },
];

const MARKETING: MarketingMaterial[] = [
  { id: 'instagram', label: 'Instagram Post', icon: 'Instagram', color: 'from-pink-500 to-rose-500', size: '1080 × 1080' },
  { id: 'facebook', label: 'Facebook Post', icon: 'Facebook', color: 'from-blue-500 to-blue-600', size: '1200 × 630' },
  { id: 'festival', label: 'Festival Poster', icon: 'Sparkles', color: 'from-amber-500 to-orange-500', size: '1080 × 1350' },
  { id: 'whatsapp', label: 'WhatsApp Status', icon: 'MessageCircle', color: 'from-green-500 to-emerald-500', size: '1080 × 1920' },
  { id: 'banner', label: 'Business Banner', icon: 'ImageIcon', color: 'from-purple-500 to-indigo-500', size: '1920 × 600' },
  { id: 'card', label: 'Business Card', icon: 'CreditCard', color: 'from-slate-600 to-zinc-700', size: '1050 × 600' },
  { id: 'flyer', label: 'Flyer', icon: 'FileText', color: 'from-red-500 to-rose-500', size: '1240 × 1754' },
  { id: 'qrposter', label: 'QR Poster', icon: 'QrCode', color: 'from-primary-500 to-secondary-500', size: '1080 × 1350' },
];

function defaultWorkspace(): GuestWorkspace {
  return {
    profile: {
      id: 'local_guest_vendor', username: 'guest-local', name: 'Guest Business', owner: 'Guest',
      phone: '', upiId: '', category: 'General', location: '', hours: '', rating: 0,
      joinedAt: '', status: 'active', description: '',
    },
    products: [],
    transactions: [],
    reviews: [],
    settings: {
      theme: 'light', language: 'en',
      notifications: { payments: true, reviews: true, schemes: false, marketing: true },
      upiId: '', linkedBank: '',
    },
    qr: { upiId: '', name: 'Guest Business', phone: '', color: '#16A34A', sound: true },
    website: { template: 'food', published: false, slug: '' },
    businessCard: {
      template: 'modern', orientation: 'landscape', backgroundColor: '#0f172a',
      accentColor: '#22c55e', textColor: '#ffffff', fontFamily: 'sans',
      tagline: 'Professional service you can trust', showPhoto: true, showPhone: true,
      showEmail: false, showUpi: true, showLocation: true, showHours: true,
      showDescription: false, showQr: true,
    },
    notifications: [],
    gallery: [],
    bookmarks: [],
    businessProfileUpdatedAt: null,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function loadWorkspace(): GuestWorkspace {
  const defaults = defaultWorkspace();
  if (!storageAvailable()) return defaults;
  try {
    const stored = sessionStorage.getItem(WORKSPACE_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored) as Partial<GuestWorkspace>;
    return {
      ...defaults,
      ...parsed,
      profile: { ...defaults.profile, ...(parsed.profile || {}) },
      settings: {
        ...defaults.settings,
        ...(parsed.settings || {}),
        notifications: { ...defaults.settings.notifications, ...(parsed.settings?.notifications || {}) },
      },
      qr: { ...defaults.qr, ...(parsed.qr || {}) },
      website: { ...defaults.website, ...(parsed.website || {}) },
      businessCard: { ...defaults.businessCard, ...(parsed.businessCard || {}) },
      products: parsed.products || [], transactions: parsed.transactions || [], reviews: parsed.reviews || [],
      notifications: parsed.notifications || [], gallery: parsed.gallery || [], bookmarks: parsed.bookmarks || [],
    };
  } catch {
    return defaults;
  }
}

function saveWorkspace(workspace: GuestWorkspace) {
  if (!storageAvailable()) return;
  try {
    sessionStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
  } catch {
    throw new Error('Guest browser storage is full. Remove some local images or products and try again.');
  }
}

export function clearGuestWorkspace() {
  if (!storageAvailable()) return;
  sessionStorage.removeItem(WORKSPACE_KEY);
  sessionStorage.removeItem(GUEST_SESSION_TOKEN_KEY);
}

function id(prefix: string) {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${suffix}`;
}

function analytics(): Analytics {
  return { sales: [], productViews: [], trafficSources: [] };
}

function schemes(workspace: GuestWorkspace): Scheme[] {
  return SCHEMES.map((scheme) => ({ ...scheme, bookmarked: workspace.bookmarks.includes(scheme.id) }));
}

function dashboard(workspace: GuestWorkspace): DashboardData {
  const successful = workspace.transactions.filter((transaction) => transaction.status === 'success');
  return {
    stats: {
      todaysPayments: successful.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
      orders: workspace.transactions.length,
      visitors: 0,
      qrScans: 0,
      productViews: 0,
      schemes: workspace.bookmarks.length,
      products: workspace.products.length,
    },
    sales: [],
    transactions: clone(workspace.transactions),
    schemes: schemes(workspace).filter((scheme) => scheme.bookmarked),
  };
}

function bodyObject(body: unknown): Record<string, any> {
  return body && typeof body === 'object' ? body as Record<string, any> : {};
}

export interface GuestRequestResult<T = unknown> {
  handled: boolean;
  data?: T;
}

/**
 * Handles all guest workspace operations in sessionStorage. The only requests
 * intentionally allowed to reach the backend are read-only vendor discovery
 * requests, which use the stateless guest token and cannot mutate data.
 */
export async function guestRequest<T>(method: string, rawUrl: string, body?: unknown): Promise<GuestRequestResult<T>> {
  const path = rawUrl.split('?')[0];
  const guestLogin = path === '/api/auth/guest';
  const activeGuest = storageAvailable() && sessionStorage.getItem(GUEST_SESSION_TOKEN_KEY) === GUEST_TOKEN;
  if (!guestLogin && !activeGuest) return { handled: false };

  if (method === 'GET' && (path === '/api/vendors/search' || /^\/api\/vendors\/[^/]+$/.test(path))) {
    return { handled: false };
  }

  if (guestLogin) {
    clearGuestWorkspace();
    sessionStorage.setItem(GUEST_SESSION_TOKEN_KEY, GUEST_TOKEN);
    saveWorkspace(defaultWorkspace());
    return { handled: true, data: { token: GUEST_TOKEN, user: clone(LOCAL_GUEST_USER) } as T };
  }

  if (path === '/api/auth/me') return { handled: true, data: clone(LOCAL_GUEST_USER) as T };
  if (path === '/api/auth/logout' || path === '/api/account') {
    clearGuestWorkspace();
    return { handled: true, data: { ok: true } as T };
  }

  const workspace = loadWorkspace();
  const input = bodyObject(body);

  if (path === '/api/profile') {
    if (method === 'GET') return { handled: true, data: clone(workspace.profile) as T };
    if (method === 'PUT') {
      const allowed = ['username', 'name', 'owner', 'phone', 'upiId', 'category', 'location', 'hours', 'logo', 'photo', 'description'] as const;
      for (const key of allowed) if (Object.prototype.hasOwnProperty.call(input, key)) (workspace.profile as any)[key] = input[key];
      if (typeof workspace.profile.username === 'string') workspace.profile.username = workspace.profile.username.toLowerCase();
      saveWorkspace(workspace);
      return { handled: true, data: clone(workspace.profile) as T };
    }
  }

  if (path === '/api/profile/picture' && method === 'DELETE') {
    delete workspace.profile.logo;
    saveWorkspace(workspace);
    return { handled: true, data: clone(workspace.profile) as T };
  }

  if (path === '/api/business-profile') {
    if (method === 'GET') {
      return { handled: true, data: {
        businessName: workspace.profile.name, name: workspace.profile.name,
        upiId: workspace.profile.upiId, phone: workspace.profile.phone,
        updatedAt: workspace.businessProfileUpdatedAt, conflict: false,
      } as T };
    }
    if (method === 'PATCH') {
      if (input.businessName !== undefined || input.name !== undefined) workspace.profile.name = String(input.businessName ?? input.name);
      if (input.upiId !== undefined) workspace.profile.upiId = String(input.upiId);
      if (input.phone !== undefined) workspace.profile.phone = String(input.phone);
      workspace.qr = { ...workspace.qr, name: workspace.profile.name, upiId: workspace.profile.upiId, phone: workspace.profile.phone };
      workspace.settings.upiId = workspace.profile.upiId;
      workspace.businessProfileUpdatedAt = new Date().toISOString();
      saveWorkspace(workspace);
      return { handled: true, data: {
        businessName: workspace.profile.name, name: workspace.profile.name,
        upiId: workspace.profile.upiId, phone: workspace.profile.phone,
        updatedAt: workspace.businessProfileUpdatedAt, conflict: false, previousUpdatedAt: null,
      } as T };
    }
  }

  if (path === '/api/products' && method === 'GET') return { handled: true, data: clone(workspace.products) as T };
  if (path === '/api/products' && method === 'POST') {
    const product: Product = {
      id: id('guest_product'), name: String(input.name || 'Untitled Product'), category: String(input.category || 'General'),
      price: Number(input.price || 0), offerPrice: input.offerPrice === '' || input.offerPrice == null ? undefined : Number(input.offerPrice),
      stock: Number(input.stock || 0), available: input.available !== false, description: String(input.description || ''),
      image: String(input.image || ''), popular: Boolean(input.popular), discount: input.discount == null ? undefined : Number(input.discount),
    };
    workspace.products.unshift(product); saveWorkspace(workspace);
    return { handled: true, data: clone(product) as T };
  }
  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch && method === 'PUT') {
    const index = workspace.products.findIndex((product) => product.id === decodeURIComponent(productMatch[1]));
    if (index < 0) throw new Error('Product not found');
    workspace.products[index] = { ...workspace.products[index], ...input };
    saveWorkspace(workspace); return { handled: true, data: clone(workspace.products[index]) as T };
  }
  if (productMatch && method === 'DELETE') {
    workspace.products = workspace.products.filter((product) => product.id !== decodeURIComponent(productMatch[1]));
    saveWorkspace(workspace); return { handled: true, data: { ok: true } as T };
  }

  if (path === '/api/transactions' && method === 'GET') return { handled: true, data: clone(workspace.transactions) as T };
  if (path === '/api/transactions' && method === 'POST') {
    const transaction: Transaction = {
      id: id('guest_transaction'), vendor: workspace.profile.name, amount: Number(input.amount || 0),
      method: input.method || 'UPI', status: input.status || 'success', date: input.date || new Date().toISOString(),
    };
    workspace.transactions.unshift(transaction); saveWorkspace(workspace);
    return { handled: true, data: clone(transaction) as T };
  }

  if (path === '/api/schemes' && method === 'GET') return { handled: true, data: schemes(workspace) as T };
  const bookmarkMatch = path.match(/^\/api\/schemes\/([^/]+)\/bookmark$/);
  if (bookmarkMatch && method === 'POST') {
    const schemeId = decodeURIComponent(bookmarkMatch[1]);
    workspace.bookmarks = input.bookmarked
      ? Array.from(new Set([...workspace.bookmarks, schemeId]))
      : workspace.bookmarks.filter((value) => value !== schemeId);
    saveWorkspace(workspace); return { handled: true, data: { ok: true } as T };
  }

  if (path === '/api/reviews' && method === 'GET') return { handled: true, data: clone(workspace.reviews) as T };
  if (path === '/api/analytics' && method === 'GET') return { handled: true, data: analytics() as T };
  if (path === '/api/dashboard' && method === 'GET') return { handled: true, data: dashboard(workspace) as T };

  if (path === '/api/settings') {
    if (method === 'GET') return { handled: true, data: clone(workspace.settings) as T };
    if (method === 'PUT') {
      workspace.settings = {
        ...workspace.settings, ...input,
        notifications: { ...workspace.settings.notifications, ...(input.notifications || {}) },
      };
      saveWorkspace(workspace); return { handled: true, data: clone(workspace.settings) as T };
    }
  }

  if (path === '/api/qr') {
    if (method === 'GET') return { handled: true, data: clone({ ...workspace.qr, upiId: workspace.profile.upiId, name: workspace.profile.name, phone: workspace.profile.phone }) as T };
    if (method === 'PUT') {
      workspace.qr = { ...workspace.qr, ...input };
      if (input.upiId !== undefined) workspace.profile.upiId = String(input.upiId);
      if (input.name !== undefined) workspace.profile.name = String(input.name);
      if (input.phone !== undefined) workspace.profile.phone = String(input.phone);
      saveWorkspace(workspace); return { handled: true, data: clone(workspace.qr) as T };
    }
  }

  if (path === '/api/website') {
    if (method === 'GET') return { handled: true, data: clone(workspace.website) as T };
    if (method === 'PUT') { workspace.website = { ...workspace.website, ...input }; saveWorkspace(workspace); return { handled: true, data: clone(workspace.website) as T }; }
  }

  if (path === '/api/business-card') {
    if (method === 'GET') return { handled: true, data: clone(workspace.businessCard) as T };
    if (method === 'PUT') {
      workspace.businessCard = { ...workspace.businessCard, ...input, updatedAt: new Date().toISOString() };
      saveWorkspace(workspace); return { handled: true, data: clone(workspace.businessCard) as T };
    }
  }

  if (path === '/api/marketing' && method === 'GET') return { handled: true, data: clone(MARKETING) as T };

  if (path === '/api/notifications' && method === 'GET') return { handled: true, data: clone(workspace.notifications) as T };
  if (path === '/api/notifications' && method === 'POST') {
    const notification: Notification = {
      id: id('guest_notification'), type: String(input.type || 'info'), title: String(input.title || ''),
      description: String(input.description || ''), time: String(input.time || 'just now'), read: false,
    };
    workspace.notifications.unshift(notification); saveWorkspace(workspace);
    return { handled: true, data: clone(notification) as T };
  }
  if (path === '/api/notifications/read-all' && method === 'POST') {
    workspace.notifications = workspace.notifications.map((notification) => ({ ...notification, read: true }));
    saveWorkspace(workspace); return { handled: true, data: { ok: true } as T };
  }
  const notificationMatch = path.match(/^\/api\/notifications\/([^/]+)$/);
  if (notificationMatch && method === 'PUT') {
    const notification = workspace.notifications.find((item) => item.id === decodeURIComponent(notificationMatch[1]));
    if (notification) notification.read = Boolean(input.read);
    saveWorkspace(workspace); return { handled: true, data: { ok: true } as T };
  }
  if (notificationMatch && method === 'DELETE') {
    workspace.notifications = workspace.notifications.filter((item) => item.id !== decodeURIComponent(notificationMatch[1]));
    saveWorkspace(workspace); return { handled: true, data: { ok: true } as T };
  }

  if (path === '/api/gallery' && method === 'GET') return { handled: true, data: clone(workspace.gallery) as T };
  if (path === '/api/gallery' && method === 'POST') {
    const image: GalleryImage = { id: id('guest_gallery'), url: String(input.url || ''), caption: String(input.caption || ''), sortOrder: workspace.gallery.length, createdAt: new Date().toISOString() };
    workspace.gallery.push(image); saveWorkspace(workspace); return { handled: true, data: clone(image) as T };
  }
  const galleryMatch = path.match(/^\/api\/gallery\/([^/]+)$/);
  if (galleryMatch && method === 'PUT') {
    const index = workspace.gallery.findIndex((image) => image.id === decodeURIComponent(galleryMatch[1]));
    if (index < 0) throw new Error('Image not found');
    workspace.gallery[index] = { ...workspace.gallery[index], ...input };
    saveWorkspace(workspace); return { handled: true, data: clone(workspace.gallery[index]) as T };
  }
  if (galleryMatch && method === 'DELETE') {
    workspace.gallery = workspace.gallery.filter((image) => image.id !== decodeURIComponent(galleryMatch[1]));
    saveWorkspace(workspace); return { handled: true, data: { ok: true } as T };
  }

  if (path === '/api/uploads' && method === 'POST') {
    const dataUrl = String(input.dataUrl || '');
    if (!dataUrl.startsWith('data:image/')) throw new Error('Guest images must be valid local image data');
    const mime = dataUrl.slice(5, dataUrl.indexOf(';')) || 'image/jpeg';
    const base64 = dataUrl.split(',')[1] || '';
    return { handled: true, data: { id: id('guest_upload'), url: dataUrl, mime, sizeBytes: Math.floor(base64.length * 0.75), localOnly: true } as T };
  }
  if (path === '/api/uploads' && method === 'DELETE') return { handled: true, data: { ok: true } as T };

  if (method === 'GET' && path.startsWith('/api/public/vendor/')) {
    return { handled: true, data: {
      vendor: clone(workspace.profile),
      products: clone(workspace.products.filter((product) => product.available)),
      reviews: clone(workspace.reviews),
      qr: clone({ ...workspace.qr, upiId: workspace.profile.upiId, name: workspace.profile.name, phone: workspace.profile.phone }),
      localOnly: true,
    } as T };
  }

  if (path.startsWith('/api/admin/')) throw new Error('Guest mode cannot access administrator features');
  throw new Error(`Guest mode does not support ${method} ${path}`);
}
