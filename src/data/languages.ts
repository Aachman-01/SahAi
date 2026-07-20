import type { Language } from '@/types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
];

type Dict = Record<string, string>;

const en: Dict = {
  appName: 'SahAI',
  getStarted: 'Get Started',
  watchDemo: 'Watch Demo',
  login: 'Login',
  logout: 'Logout',
  dashboard: 'Dashboard',
  businessProfile: 'Business Profile',
  products: 'Products',
  qrPayment: 'QR Payment',
  websiteBuilder: 'Website Builder',
  marketing: 'Marketing',
  businessCard: 'Business Card',
  schemes: 'Govt Schemes',
  analytics: 'Analytics',
  settings: 'Settings',
  notifications: 'Notifications',
  save: 'Save',
  cancel: 'Cancel',
  generate: 'Generate',
  download: 'Download',
  search: 'Search',
};

const hi: Dict = {
  appName: 'SahAI',
  getStarted: 'शुरू करें',
  watchDemo: 'डेमो देखें',
  login: 'लॉगिन',
  logout: 'लॉगआउट',
  dashboard: 'डैशबोर्ड',
  businessProfile: 'बिज़नेस प्रोफ़ाइल',
  products: 'उत्पाद',
  qrPayment: 'QR भुगतान',
  websiteBuilder: 'वेबसाइट बिल्डर',
  marketing: 'मार्केटिंग',
  businessCard: 'बिज़नेस कार्ड',
  schemes: 'सरकारी योजनाएं',
  analytics: 'एनालिटिक्स',
  settings: 'सेटिंग्स',
  notifications: 'सूचनाएं',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  generate: 'बनाएं',
  download: 'डाउनलोड',
  search: 'खोजें',
};

const dictionaries: Record<string, Dict> = { en, hi };

export function translate(lang: string, key: string): string {
  return dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
}
