import { Suspense, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from '@/components/ProtectedRoute'
import IdentityGate from '@/components/IdentityGate'
import ParentLogin from './pages/ParentLogin'
import GroupLanding from './pages/GroupLanding'
import Management from './pages/Management'
import ParentCompany from './pages/ParentCompany'

const Loading = () => <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>

const externalRoutes = [
  ['/sportruo', 'https://sportruo.vercel.app/'],
  ['/company/sportruo', 'https://sportruo.vercel.app/'],
  ['/company/sportruo/dashboard', 'https://sportruo.vercel.app/'],
  ['/adom', 'https://adom-global-commerce.vercel.app/'],
  ['/company/adom', 'https://adom-global-commerce.vercel.app/'],
  ['/healthruo', 'https://healthruo-standalone.vercel.app/'],
  ['/company/healthruo', 'https://healthruo-standalone.vercel.app/'],
  ['/logistics', 'https://xedruo-global-logistics.vercel.app/'],
  ['/company/logistics', 'https://xedruo-global-logistics.vercel.app/'],
  ['/properties', 'https://xedruo-properties-standalone.vercel.app/'],
  ['/company/properties', 'https://xedruo-properties-standalone.vercel.app/'],
  ['/properties/workspace', 'https://xedruo-properties-standalone.vercel.app/properties/workspace'],
  ['/properties/list', 'https://xedruo-properties-standalone.vercel.app/properties/list'],
  ['/spacetruo', 'https://spacetruo-standalone.vercel.app/'],
  ['/company/spacetruo', 'https://spacetruo-standalone.vercel.app/'],
  ['/hireuo', 'https://hireuo.xedruo.com/'],
  ['/company/hireuo', 'https://hireuo.xedruo.com/'],
  ['/hireuo/workspace', 'https://hireuo.xedruo.com/'],
  ['/xedrion-ai', 'https://xedrion-ai.vercel.app/'],
  ['/music', 'https://xedruo-music-distribution.vercel.app/'],
  ['/distribution', 'https://xedruo-music-distribution.vercel.app/distribution'],
  ['/pay-and-play', 'https://xedruo-pay-and-play.vercel.app/'],
  ['/company/pay-bank', 'https://xedruo-pay-and-play.vercel.app/'],
]

const publicPaths = new Set([
  '/', '/ecosystem', '/login', '/parent-company',
  '/pricing', '/dashboard', ...externalRoutes.map(([path]) => path),
])

function ExternalRedirect({ to }) {
  useEffect(() => { window.location.replace(to) }, [to])
  return <Loading />
}

function AuthenticatedApp() {
  const location = useLocation()
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth()

  if (isLoadingPublicSettings || isLoadingAuth) return <Loading />

  const isParentRoute = location.pathname === '/parent-company'
  // Parent Company uses its own private Neon administrator session, not customer auth.
  if (authError && !isParentRoute) {
    if (authError.type === 'user_not_registered' || authError.type === 'auth_required') {
      if (!publicPaths.has(location.pathname)) {
        if (authError.type === 'user_not_registered') return <UserNotRegisteredError />
        navigateToLogin()
        return null
      }
    } else if (!publicPaths.has(location.pathname)) {
      return <UserNotRegisteredError />
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/ecosystem" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        {externalRoutes.map(([path, url]) => <Route key={path} path={path} element={<ExternalRedirect to={url} />} />)}
        <Route path="/management" element={<ProtectedRoute unauthenticatedElement={<ParentLogin />}><IdentityGate><Management /></IdentityGate></ProtectedRoute>} />
        <Route path="/login" element={<ParentLogin />} />
        <Route path="/register" element={<Navigate to="/parent-company" replace />} />
        <Route path="/auth/callback" element={<Navigate to="/parent-company" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/parent-company" replace />} />
        <Route path="/reset-password" element={<Navigate to="/parent-company" replace />} />
        <Route path="/onboarding" element={<Navigate to="/parent-company" replace />} />
        <Route path="/parent-company" element={<ParentCompany />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
