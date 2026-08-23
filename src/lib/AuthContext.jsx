import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { xedruo } from '@/api/xedruoClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
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
    setUser(null); setIsAuthenticated(false);
    if (shouldRedirect) xedruo.auth.logout(); else localStorage.removeItem('xedruo_supabase_session');
  };

  const navigateToLogin = () => xedruo.auth.redirectToLogin();

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings: null, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>
    {children}
  </AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
