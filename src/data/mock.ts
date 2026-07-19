import type { Product, Scheme, Transaction, Vendor, Review } from '@/types';

export const VENDORS: Vendor[] = [
  {
    id: 'v1', name: 'Rahul Fruits', owner: 'Rahul Kumar', phone: '+91 98765 43210',
    upiId: 'rahulfruits@upi', category: 'Fruits & Vegetables', location: 'Hazratganj, Lucknow',
    hours: '7 AM – 9 PM', rating: 4.6, joinedAt: '2024-08-12', status: 'active',
  },
  {
    id: 'v2', name: 'Sai Tea Stall', owner: 'Sai Prasad', phone: '+91 99876 54321',
    upiId: 'saitea@upi', category: 'Tea & Snacks', location: 'Connaught Place, Delhi',
    hours: '6 AM – 11 PM', rating: 4.8, joinedAt: '2024-06-01', status: 'active',
  },
  {
    id: 'v3', name: 'Lakshmi Flowers', owner: 'Lakshmi N.', phone: '+91 90123 45678',
    upiId: 'lakshmiflowers@upi', category: 'Flowers', location: 'Mysuru, Karnataka',
    hours: '5 AM – 8 PM', rating: 4.7, joinedAt: '2024-09-22', status: 'pending',
  },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Alphonso Mango', category: 'Fruits', price: 350, offerPrice: 280, stock: 24, available: true, description: 'Fresh Ratnagiri Alphonso mangoes, sweet & aromatic.', image: 'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&w=600', popular: true, discount: 20 },
  { id: 'p2', name: 'Banana (Dozen)', category: 'Fruits', price: 60, stock: 50, available: true, description: 'Ripe yellow bananas, farm fresh.', image: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&w=600', popular: true },
  { id: 'p3', name: 'Tomato (1kg)', category: 'Vegetables', price: 40, offerPrice: 32, stock: 80, available: true, description: 'Hybrid red tomatoes.', image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&w=600', discount: 20 },
  { id: 'p4', name: 'Masala Chai', category: 'Beverages', price: 15, stock: 200, available: true, description: 'Authentic Indian masala chai.', image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&w=600', popular: true },
  { id: 'p5', name: 'Marigold Garland', category: 'Flowers', price: 120, stock: 15, available: true, description: 'Hand-strung fresh marigold garland.', image: 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&w=600' },
  { id: 'p6', name: 'Rose Bouquet', category: 'Flowers', price: 250, offerPrice: 199, stock: 8, available: false, description: '12-stem red rose bouquet.', image: 'https://images.pexels.com/photos/1580287/pexels-photo-1580287.jpeg?auto=compress&w=600', discount: 20 },
  { id: 'p7', name: 'Green Coconut', category: 'Beverages', price: 45, stock: 30, available: true, description: 'Tender coconut water, refreshing.', image: 'https://images.pexels.com/photos/8472898/pexels-photo-8472898.jpeg?auto=compress&w=600' },
  { id: 'p8', name: 'Samosa (2 pcs)', category: 'Snacks', price: 30, stock: 0, available: false, description: 'Crispy potato samosas.', image: 'https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&w=600' },
];

export const TRANSACTIONS: Transaction[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `t${i + 1}`,
  vendor: VENDORS[i % VENDORS.length].name,
  amount: Math.round(Math.random() * 800 + 20),
  method: (['UPI', 'Cash', 'Card'] as const)[i % 3],
  status: (['success', 'pending', 'failed'] as const)[i % 3],
  date: `2025-07-${String(18 - (i % 18)).padStart(2, '0')} ${10 + (i % 10)}:${i % 60 < 10 ? '0' : ''}${i % 60}`,
}));

export const SCHEMES: Scheme[] = [
  {
    id: 's1', name: 'PM SVANidhi', ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Micro Credit',
    eligibility: ['Street vendor with valid certificate', 'Urban areas', 'No prior loan default'],
    documents: ['Vending certificate', 'Aadhaar', 'Bank passbook', 'Photo'],
    benefits: 'Working capital loan up to ₹10,000 with 7% interest subsidy.',
    applyUrl: 'https://pmsvanidhi.mohua.gov.in/',
  },
  {
    id: 's2', name: 'PMMY (Mudra Loan)', ministry: 'Ministry of Finance',
    category: 'Business Loan',
    eligibility: ['Non-corporate small business', 'Income generating activity'],
    documents: ['Aadhaar', 'PAN', 'Business plan', 'Bank statement'],
    benefits: 'Loan up to ₹10 lakh under Shishu, Kishore, Tarun categories.',
    applyUrl: 'https://www.mudra.org.in/',
  },
  {
    id: 's3', name: 'MSME Udyam Registration', ministry: 'Ministry of MSME',
    category: 'Registration',
    eligibility: ['Investment below ₹10 crore', 'Turnover below ₹50 crore'],
    documents: ['Aadhaar', 'PAN'],
    benefits: 'Subsidies, lower interest rates, protection against delayed payments.',
    applyUrl: 'https://udyamregistration.gov.in/',
  },
  {
    id: 's4', name: 'Stand-Up India', ministry: 'Ministry of Finance',
    category: 'Loan',
    eligibility: ['SC/ST/Women entrepreneurs', 'First-time borrower'],
    documents: ['Aadhaar', 'PAN', 'Project report'],
    benefits: 'Bank loans between ₹10 lakh and ₹1 crore for greenfield enterprises.',
    applyUrl: 'https://www.standupmitra.in/',
  },
  {
    id: 's5', name: 'PM Vishwakarma Yojana', ministry: 'Ministry of MSME',
    category: 'Artisan',
    eligibility: ['Traditional artisans & craftspeople', 'Self-employed'],
    documents: ['Aadhaar', 'Mobile', 'Bank details'],
    benefits: 'Collateral-free loan up to ₹3 lakh, toolkit & training.',
    applyUrl: 'https://pmvishwakarma.gov.in/',
  },
  {
    id: 's6', name: 'National Urban Livelihoods Mission', ministry: 'Ministry of HUA',
    category: 'Livelihood',
    eligibility: ['Urban poor', 'Vendors', 'Homeless'],
    documents: ['Aadhaar', 'Address proof'],
    benefits: 'Skill training, shelter, credit access.',
    applyUrl: 'https://nulm.gov.in/',
  },
];

export const REVIEWS: Review[] = [
  { id: 'r1', author: 'Anjali S.', rating: 5, comment: 'Best mangoes in the market! Always fresh.', date: '2025-07-10' },
  { id: 'r2', author: 'Imran K.', rating: 4, comment: 'Good quality, prices are fair.', date: '2025-07-08' },
  { id: 'r3', author: 'Priya M.', rating: 5, comment: 'Rahul bhaiya is very polite. UPI accepted!', date: '2025-07-05' },
];

export const SALES_DATA = [
  { month: 'Jan', sales: 4200, visitors: 1200, scans: 320 },
  { month: 'Feb', sales: 5100, visitors: 1500, scans: 410 },
  { month: 'Mar', sales: 6300, visitors: 1900, scans: 520 },
  { month: 'Apr', sales: 5800, visitors: 2100, scans: 610 },
  { month: 'May', sales: 7400, visitors: 2600, scans: 780 },
  { month: 'Jun', sales: 8200, visitors: 3100, scans: 920 },
  { month: 'Jul', sales: 9100, visitors: 3400, scans: 1050 },
];

export const PRODUCT_VIEWS = [
  { name: 'Mango', views: 420 },
  { name: 'Banana', views: 380 },
  { name: 'Chai', views: 610 },
  { name: 'Tomato', views: 240 },
  { name: 'Garland', views: 180 },
];

export const TRAFFIC_SOURCES = [
  { name: 'Direct', value: 42, color: '#16A34A' },
  { name: 'Google', value: 28, color: '#2563EB' },
  { name: 'WhatsApp', value: 18, color: '#F59E0B' },
  { name: 'QR Scan', value: 12, color: '#a855f7' },
];
