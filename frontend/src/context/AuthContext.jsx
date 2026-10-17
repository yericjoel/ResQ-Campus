import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  // Restore the session from the saved token when the page loads.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authService
      .profile()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const initiateLogin = useCallback(async (email, password) => {
    return await authService.login(email, password);
  }, []);

  const verifyLogin = useCallback(async (email, code) => {
    const { token, user: loggedIn } = await authService.verifyLogin(email, code);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const resendCode = useCallback(async (email) => {
    return await authService.resendCode(email);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      login: initiateLogin,
      initiateLogin,
      verifyLogin,
      resendCode,
      logout,
      token: localStorage.getItem(TOKEN_KEY),
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SECURITY',
    }),
    [user, loading, initiateLogin, verifyLogin, resendCode, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
