import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { xedruo } from '@/api/xedruoClient';

const AuthContext = createContext();
const DEV_BYPASS_AUTH = import.meta.env.DEV;
const devUser = { id: 'dev-xedruo-user', email: 'developer@xedruo.local', name: 'Xedruo Developer', role: 'admin' };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEV_BYPASS_AUTH ? devUser : null);
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_BYPASS_AUTH);
  const [isLoadingAuth, setIsLoadingAuth] = useState(!DEV_BYPASS_AUTH);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(DEV_BYPASS_AUTH);

  const checkUserAuth = useCallback(async () => {
    if (DEV_BYPASS_AUTH) {
      setUser(devUser); setIsAuthenticated(true); setIsLoadingAuth(false); setAuthError(null); setAuthChecked(true); return;
    }
    setIsLoadingAuth(true); setAuthError(null);
    try {
      const currentUser = await xedruo.auth.me();
      setUser(currentUser); setIsAuthenticated(true);
    } catch (error) {
      setUser(null); setIsAuthenticated(false);
      if (error?.status && error.status !== 401) setAuthError({ type: 'unknown', message: error.message });
    } finally { setIsLoadingAuth(false); setAuthChecked(true); }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const logout = (shouldRedirect = true) => {
    if (DEV_BYPASS_AUTH) return;
    setUser(null); setIsAuthenticated(false);
    if (shouldRedirect) xedruo.auth.logout(); else localStorage.removeItem('xedruo_supabase_session');
  };

  const navigateToLogin = () => { if (!DEV_BYPASS_AUTH) xedruo.auth.redirectToLogin(); };

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
