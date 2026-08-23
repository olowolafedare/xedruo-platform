import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GroupLanding from './pages/GroupLanding';
import Pricing from './pages/Pricing';
import DashboardLayout from './components/app/DashboardLayout';
import Distribution from './pages/Distribution';
import Promotion from './pages/Promotion';
import ProducerSuite from './pages/ProducerSuite';
import CreatorPayments from './pages/CreatorPayments';
import SellTickets from './pages/SellTickets';
import Invest from './pages/Invest';
import Publishing from './pages/Publishing';
import Royalties from './pages/Royalties';
import LabelDashboard from './pages/LabelDashboard';
import ArtistManagement from './pages/ArtistManagement';
import CreatorStore from './pages/CreatorStore';
import Notifications from './pages/Notifications';
import KYC from './pages/KYC';
import Support from './pages/Support';
import AdminReports from './pages/AdminReports';
import BookStudio from './pages/BookStudio';
import ArtistCatalog from './pages/ArtistCatalog';
import ArtistProfilePage from './pages/ArtistProfilePage';
import Ecosystem from './pages/Ecosystem';
import PayAndPlay from './pages/PayAndPlay';
import XedruoPayBank from './pages/XedruoPayBank';
import Management from './pages/Management';
import CompanyDashboard from './pages/CompanyDashboard';
import WelcomeXedruo from './pages/WelcomeXedruo';
import DeveloperWorkstation from './pages/DeveloperWorkstation';
import ParentCompany from './pages/ParentCompany';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<GroupLanding />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/ecosystem" element={<Ecosystem />} />
      <Route path="/company/pay-and-play" element={<PayAndPlay />} />
      <Route path="/management" element={<Management />} />
      <Route path="/company/pay-bank" element={<XedruoPayBank />} />
      {/* Parent-company URL for Music Distribution resolves to the untouched existing platform. */}
      <Route path="/company/music-distribution" element={<Navigate to="/distribution" replace />} />
      <Route path="/company/:slug" element={<CompanyDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Ecosystem />} />
          <Route path="/welcome" element={<WelcomeXedruo />} />
          <Route path="/parent-company" element={<ParentCompany />} />
          <Route path="/developer-workstation" element={<DeveloperWorkstation />} />
          {/* Existing Music Distribution platform — intentionally left untouched. */}
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/promotion" element={<Promotion />} />
          <Route path="/producer-suite" element={<ProducerSuite />} />
          <Route path="/creator-payments" element={<CreatorPayments />} />
          <Route path="/sell-tickets" element={<SellTickets />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/publishing" element={<Publishing />} />
          <Route path="/royalties" element={<Royalties />} />
          <Route path="/label-dashboard" element={<LabelDashboard />} />
          <Route path="/artist-management" element={<ArtistManagement />} />
          <Route path="/creator-store" element={<CreatorStore />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/book-studio" element={<BookStudio />} />
          <Route path="/artist-catalog" element={<ArtistCatalog />} />
          <Route path="/artist/:id" element={<ArtistProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return <AuthProvider><QueryClientProvider client={queryClientInstance}><Router><ScrollToTop /><AuthenticatedApp /></Router><Toaster /></QueryClientProvider></AuthProvider>
}

export default App
