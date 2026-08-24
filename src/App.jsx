import { lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from './components/app/DashboardLayout';
import Login from './pages/Login';
import ParentLogin from './pages/ParentLogin';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GroupLanding from './pages/GroupLanding';
import Pricing from './pages/Pricing';
import Ecosystem from './pages/Ecosystem';
import Management from './pages/Management';
import CompanyDashboard from './pages/CompanyDashboard';
import WelcomeXedruo from './pages/WelcomeXedruo';
import AdomLanding from './pages/AdomLanding';

const Distribution = lazy(() => import('./pages/Distribution'));
const Promotion = lazy(() => import('./pages/Promotion'));
const ProducerSuite = lazy(() => import('./pages/ProducerSuite'));
const CreatorPayments = lazy(() => import('./pages/CreatorPayments'));
const SellTickets = lazy(() => import('./pages/SellTickets'));
const Invest = lazy(() => import('./pages/Invest'));
const Publishing = lazy(() => import('./pages/Publishing'));
const Royalties = lazy(() => import('./pages/Royalties'));
const LabelDashboard = lazy(() => import('./pages/LabelDashboard'));
const ArtistManagement = lazy(() => import('./pages/ArtistManagement'));
const CreatorStore = lazy(() => import('./pages/CreatorStore'));
const Notifications = lazy(() => import('./pages/Notifications'));
const KYC = lazy(() => import('./pages/KYC'));
const Support = lazy(() => import('./pages/Support'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const BookStudio = lazy(() => import('./pages/BookStudio'));
const ArtistCatalog = lazy(() => import('./pages/ArtistCatalog'));
const ArtistProfilePage = lazy(() => import('./pages/ArtistProfilePage'));
const PayAndPlay = lazy(() => import('./pages/PayAndPlay'));
const XedruoPayBank = lazy(() => import('./pages/XedruoPayBank'));
const DeveloperWorkstation = lazy(() => import('./pages/DeveloperWorkstation'));
const ParentCompany = lazy(() => import('./pages/ParentCompany'));

const independentCompanies = ['pay-and-play','sportruo','hireuo','adom','agruo','healthruo','education','capital','energy','logistics','properties','spacetruo','xedruo-ai'];
const Loading = () => <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) return <Loading />;
  const isParentRoute = location.pathname === '/parent-company';
  if (authError) {
    if (authError.type === 'user_not_registered') return isParentRoute ? <ParentLogin /> : <UserNotRegisteredError />;
    if (authError.type === 'auth_required') {
      if (isParentRoute) return <ParentLogin />;
      navigateToLogin(); return null;
    }
  }
  return <Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={<GroupLanding />} /><Route path="/pricing" element={<Pricing />} /><Route path="/ecosystem" element={<Ecosystem />} />
    <Route path="/company/pay-and-play" element={<Navigate to="/pay-and-play" replace />} /><Route path="/company/music-distribution" element={<Navigate to="/distribution" replace />} /><Route path="/company/adom" element={<Navigate to="/adom" replace />} /><Route path="/company/:slug" element={<CompanyDashboard />} />
    <Route path="/management" element={<Management />} /><Route path="/company/pay-bank" element={<XedruoPayBank />} /><Route path="/pay-and-play" element={<PayAndPlay />} /><Route path="/adom" element={<AdomLanding />} />
    {independentCompanies.filter(slug => slug !== 'pay-and-play' && slug !== 'adom').map(slug => <Route key={slug} path={`/${slug}`} element={<CompanyDashboard />} />)}
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/parent-company" element={<ProtectedRoute unauthenticatedElement={<ParentLogin />}><ParentCompany /></ProtectedRoute>} />
    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}><Route element={<DashboardLayout />}>
      <Route path="/dashboard" element={<Ecosystem />} /><Route path="/welcome" element={<WelcomeXedruo />} /><Route path="/developer-workstation" element={<DeveloperWorkstation />} />
      <Route path="/distribution" element={<Distribution />} /><Route path="/promotion" element={<Promotion />} /><Route path="/producer-suite" element={<ProducerSuite />} /><Route path="/creator-payments" element={<CreatorPayments />} /><Route path="/sell-tickets" element={<SellTickets />} /><Route path="/invest" element={<Invest />} /><Route path="/publishing" element={<Publishing />} /><Route path="/royalties" element={<Royalties />} /><Route path="/label-dashboard" element={<LabelDashboard />} /><Route path="/artist-management" element={<ArtistManagement />} /><Route path="/creator-store" element={<CreatorStore />} /><Route path="/notifications" element={<Notifications />} /><Route path="/kyc" element={<KYC />} /><Route path="/support" element={<Support />} /><Route path="/admin/reports" element={<AdminReports />} /><Route path="/book-studio" element={<BookStudio />} /><Route path="/artist-catalog" element={<ArtistCatalog />} /><Route path="/artist/:id" element={<ArtistProfilePage />} />
    </Route></Route><Route path="*" element={<PageNotFound />} />
  </Routes></Suspense>;
};
function App() { return <AuthProvider><QueryClientProvider client={queryClientInstance}><Router><ScrollToTop /><AuthenticatedApp /></Router><Toaster /></QueryClientProvider></AuthProvider> }
export default App
