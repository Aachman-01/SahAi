// Initial seed data for the SahAI backend.
// This is ONLY used to populate an empty database on first run.
// After that, all data lives in the SQLite database and is fully editable.
//
// The app ships with NO demo vendor activity. A single blank vendor profile
// exists so that login works; every field starts empty and is filled in by the
// vendor. The only pre-populated content is neutral reference data that is not
// tied to any vendor: the government schemes catalog and the marketing design
// template catalog.

const VENDORS = [
  {
    id: 'v1', username: '', name: '', owner: '', phone: '',
    upiId: '', category: '', location: '',
    hours: '', rating: 0, joinedAt: '', status: 'active',
    description: '',
  },
];

const PRODUCTS = [];

const TRANSACTIONS = [];

const SCHEMES = [
  { id: 's1', name: 'PM SVANidhi', ministry: 'Ministry of Housing & Urban Affairs', category: 'Micro Credit', eligibility: ['Street vendor with valid certificate', 'Urban areas', 'No prior loan default'], documents: ['Vending certificate', 'Aadhaar', 'Bank passbook', 'Photo'], benefits: 'Working capital loan up to \u20b910,000 with 7% interest subsidy.', applyUrl: 'https://pmsvanidhi.mohua.gov.in/' },
  { id: 's2', name: 'PMMY (Mudra Loan)', ministry: 'Ministry of Finance', category: 'Business Loan', eligibility: ['Non-corporate small business', 'Income generating activity'], documents: ['Aadhaar', 'PAN', 'Business plan', 'Bank statement'], benefits: 'Loan up to \u20b910 lakh under Shishu, Kishore, Tarun categories.', applyUrl: 'https://www.mudra.org.in/' },
  { id: 's3', name: 'MSME Udyam Registration', ministry: 'Ministry of MSME', category: 'Registration', eligibility: ['Investment below \u20b910 crore', 'Turnover below \u20b950 crore'], documents: ['Aadhaar', 'PAN'], benefits: 'Subsidies, lower interest rates, protection against delayed payments.', applyUrl: 'https://udyamregistration.gov.in/' },
  { id: 's4', name: 'Stand-Up India', ministry: 'Ministry of Finance', category: 'Loan', eligibility: ['SC/ST/Women entrepreneurs', 'First-time borrower'], documents: ['Aadhaar', 'PAN', 'Project report'], benefits: 'Bank loans between \u20b910 lakh and \u20b91 crore for greenfield enterprises.', applyUrl: 'https://www.standupmitra.in/' },
  { id: 's5', name: 'PM Vishwakarma Yojana', ministry: 'Ministry of MSME', category: 'Artisan', eligibility: ['Traditional artisans & craftspeople', 'Self-employed'], documents: ['Aadhaar', 'Mobile', 'Bank details'], benefits: 'Collateral-free loan up to \u20b93 lakh, toolkit & training.', applyUrl: 'https://pmvishwakarma.gov.in/' },
  { id: 's6', name: 'National Urban Livelihoods Mission', ministry: 'Ministry of HUA', category: 'Livelihood', eligibility: ['Urban poor', 'Vendors', 'Homeless'], documents: ['Aadhaar', 'Address proof'], benefits: 'Skill training, shelter, credit access.', applyUrl: 'https://nulm.gov.in/' },
];

const REVIEWS = [];

const ANALYTICS = {
  sales: [],
  productViews: [],
  trafficSources: [],
};

const NOTIFICATIONS = [];

const BUSINESS_CARD = {
  template: 'modern',
  orientation: 'landscape',
  backgroundColor: '#0f172a',
  accentColor: '#22c55e',
  textColor: '#ffffff',
  fontFamily: 'sans',
  tagline: 'Professional service you can trust',
  showPhoto: true,
  showPhone: true,
  showEmail: true,
  showUpi: true,
  showLocation: true,
  showHours: true,
  showDescription: false,
  showQr: true,
};

const WEBSITE = { template: 'food', published: false, slug: '' };

const QR = { upiId: '', name: '', phone: '', color: '#16A34A', sound: true };

const SETTINGS = {
  theme: 'light',
  language: 'en',
  notifications: { payments: true, reviews: true, schemes: false, marketing: true },
  upiId: '',
  linkedBank: '',
};

const REPORTS = [];

const MARKETING = [
  { id: 'instagram', label: 'Instagram Post', icon: 'Instagram', color: 'from-pink-500 to-rose-500', size: '1080 \u00d7 1080' },
  { id: 'facebook', label: 'Facebook Post', icon: 'Facebook', color: 'from-blue-500 to-blue-600', size: '1200 \u00d7 630' },
  { id: 'festival', label: 'Festival Poster', icon: 'Sparkles', color: 'from-amber-500 to-orange-500', size: '1080 \u00d7 1350' },
  { id: 'whatsapp', label: 'WhatsApp Status', icon: 'MessageCircle', color: 'from-green-500 to-emerald-500', size: '1080 \u00d7 1920' },
  { id: 'banner', label: 'Business Banner', icon: 'ImageIcon', color: 'from-purple-500 to-indigo-500', size: '1920 \u00d7 600' },
  { id: 'card', label: 'Business Card', icon: 'CreditCard', color: 'from-slate-600 to-zinc-700', size: '1050 \u00d7 600' },
  { id: 'flyer', label: 'Flyer', icon: 'FileText', color: 'from-red-500 to-rose-500', size: '1240 \u00d7 1754' },
  { id: 'qrposter', label: 'QR Poster', icon: 'QrCode', color: 'from-primary-500 to-secondary-500', size: '1080 \u00d7 1350' },
];

const USERS = [
  { id: 'u_vendor', name: '', phone: '', email: 'vendor@sahai.in', role: 'vendor', vendorId: 'v1' },
  { id: 'u_admin', name: 'Admin', phone: '', email: 'admin@sahai.in', role: 'admin', vendorId: null },
  { id: 'u_guest', name: 'Guest', phone: '', email: 'guest@sahai.in', role: 'guest', vendorId: 'v1' },
];

module.exports = {
  VENDORS, PRODUCTS, TRANSACTIONS, SCHEMES, REVIEWS, ANALYTICS,
  NOTIFICATIONS, BUSINESS_CARD, WEBSITE, QR, SETTINGS, REPORTS, MARKETING, USERS,
};
