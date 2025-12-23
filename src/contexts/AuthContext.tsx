import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService, User as AuthUser, LoginResponse } from '../services/authService';
import { TokenManager } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (loginResponseData: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatusOnAppLoad: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(TokenManager.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const _setAuthenticatedState = (user: AuthUser, accessToken: string) => {
    TokenManager.setToken(accessToken);
    TokenManager.setUser(user);

    setCurrentUser(user);
    setToken(accessToken);
    setIsAuthenticated(true);
    setIsLoading(false);

    console.log('[AuthContext] User authenticated');
  };

  const _clearAuthState = async (notifyServer = true) => {
    if (notifyServer) {
      try {
        await authService.logout();
      } catch {
        // ignore
      }
    }

    TokenManager.clearTokens();
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    console.log('[AuthContext] User logged out');
  };

  // 🔑 LOGIN FIX
  const login = async (loginResponseData: LoginResponse) => {
    setIsLoading(true);
    console.log('[AuthContext] login response:', loginResponseData);

    if (!loginResponseData?.token || !loginResponseData?.user) {
      console.error('[AuthContext] Invalid login response', loginResponseData);
      setIsLoading(false);
      return;
    }

    TokenManager.setFirstTimeLogin(loginResponseData.first_time_login === 1);
    _setAuthenticatedState(loginResponseData.user, loginResponseData.token);
  };

  const logout = async () => {
    setIsLoading(true);
    await _clearAuthState(true);
  };

  const checkAuthStatusOnAppLoad = async () => {
    setIsLoading(true);
    const storedToken = TokenManager.getToken();

    if (!storedToken) {
      await _clearAuthState(false);
      return;
    }

    try {
      const { user } = await authService.validateTokenAndFetchUser();
      _setAuthenticatedState(user, storedToken);
    } catch (error) {
      console.warn('[AuthContext] Token invalid');
      await _clearAuthState(false);
    }
  };

  useEffect(() => {
    if (!token) setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        token,
        isLoading,
        login,
        logout,
        checkAuthStatusOnAppLoad,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
