import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const hiddenRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'];

export default function GlobalAuthControls() {
  const location = useLocation();
  const { user, isLoadingAuth, logout } = useAuth();

  if (isLoadingAuth || hiddenRoutes.some((route) => location.pathname === route)) return null;

  // App dashboards already provide their own account/logout controls.
  if (location.pathname === '/dashboard' || /\/dashboard$/.test(location.pathname) || location.pathname.startsWith('/pay-and-play/app')) return null;

  if (user) {
    return (
      <button
        type="button"
        onClick={() => logout(true)}
        className="fixed right-4 top-3 z-[60] inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-xl hover:bg-accent"
        title="Log out of Xedruo"
      >
        <LogOut className="h-3.5 w-3.5" />
        Log out
      </button>
    );
  }

  return (
    <Link
      to="/login"
      className="fixed right-4 top-3 z-[60] inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-xl hover:bg-accent"
    >
      <LogIn className="h-3.5 w-3.5" />
      Login
    </Link>
  );
}
