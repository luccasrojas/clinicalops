'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, AuthTokens, AuthState } from '../types';

type AuthContextValue = AuthState & {
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  getDoctorID: () => string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const idToken = localStorage.getItem('idToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (userStr && accessToken && idToken && refreshToken) {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          tokens: { accessToken, idToken, refreshToken },
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback((user: User, tokens: AuthTokens) => {
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // Save to cookies (for middleware access)
    // Set cookies with 7 days expiration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const cookieOptions = `path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;

    document.cookie = `accessToken=${tokens.accessToken}; ${cookieOptions}`;
    document.cookie = `idToken=${tokens.idToken}; ${cookieOptions}`;
    document.cookie = `refreshToken=${tokens.refreshToken}; ${cookieOptions}`;
    document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; ${cookieOptions}`;

    // Update state
    setState({
      user,
      tokens,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');

    // Clear cookies
    const pastDate = new Date(0).toUTCString();
    document.cookie = `accessToken=; path=/; expires=${pastDate}`;
    document.cookie = `idToken=; path=/; expires=${pastDate}`;
    document.cookie = `refreshToken=; path=/; expires=${pastDate}`;
    document.cookie = `user=; path=/; expires=${pastDate}`;

    // Update state
    setState({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
    });

    // Redirect to login
    router.push('/auth/login');
  }, [router]);

  const getDoctorID = useCallback((): string | null => {
    if (!state.user) return null;
    return state.user.sub || state.user.doctorID || null;
  }, [state.user]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    getDoctorID,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
