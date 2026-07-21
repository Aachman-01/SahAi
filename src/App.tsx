import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

import LandingPage from '@/pages/LandingPage';
import LanguagePage from '@/pages/LanguagePage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import ChatPage from '@/pages/ChatPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import ProductsPage from '@/pages/ProductsPage';
import QrPaymentPage from '@/pages/QrPaymentPage';
import WebsiteBuilderPage from '@/pages/WebsiteBuilderPage';
import MarketingPage from '@/pages/MarketingPage';
import BusinessCardPage from '@/pages/BusinessCardPage';
import VendorSearchPage from '@/pages/VendorSearchPage';
import SchemesPage from '@/pages/SchemesPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SettingsPage from '@/pages/SettingsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import CustomerWebsitePage from '@/pages/CustomerWebsitePage';
import AdminPage from '@/pages/AdminPage';
import NotFoundPage from '@/pages/NotFoundPage';
import MaintenancePage from '@/pages/MaintenancePage';

import { Toaster } from 'react-hot-toast';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/language" element={<LanguagePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/customer/:vendorSlug" element={<CustomerWebsitePage />} />

        <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
        <Route path="/dashboard/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
        <Route path="/dashboard/products" element={<DashboardLayout><ProductsPage /></DashboardLayout>} />
        <Route path="/dashboard/qr" element={<DashboardLayout><QrPaymentPage /></DashboardLayout>} />
        <Route path="/dashboard/website" element={<DashboardLayout><WebsiteBuilderPage /></DashboardLayout>} />
        <Route path="/dashboard/marketing" element={<DashboardLayout><MarketingPage /></DashboardLayout>} />
        <Route path="/dashboard/business-card" element={<DashboardLayout><BusinessCardPage /></DashboardLayout>} />
        <Route path="/dashboard/vendors" element={<DashboardLayout><VendorSearchPage /></DashboardLayout>} />
        <Route path="/dashboard/vendors/:username" element={<DashboardLayout><VendorSearchPage /></DashboardLayout>} />
        <Route path="/dashboard/schemes" element={<DashboardLayout><SchemesPage /></DashboardLayout>} />
        <Route path="/dashboard/analytics" element={<DashboardLayout><AnalyticsPage /></DashboardLayout>} />
        <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
        <Route path="/dashboard/notifications" element={<DashboardLayout><NotificationsPage /></DashboardLayout>} />

        <Route path="/admin" element={<AdminPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <>
      <AnimatedRoutes />
      <PwaInstallPrompt />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#0f172a',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
          },
        }}
      />
    </>
  );
}
