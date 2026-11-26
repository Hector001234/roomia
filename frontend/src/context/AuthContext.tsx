import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicUserDto, UserRole } from '../types/BookingState';
import { getAuthToken, roomiaApi, setAuthToken } from '../utils/apiClient';

interface AuthActionResult {
  ok: boolean;
  user?: PublicUserDto;
  error?: string;
}

interface AuthContextType {
  currentUser: PublicUserDto | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<AuthActionResult>;
  logout: () => void;
  switchUserSim: (user: PublicUserDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState<PublicUserDto | null>(() => {
    if (!getAuthToken()) return null;
    try {
      const stored = sessionStorage.getItem('roomia_auth_user');
      if (stored) return JSON.parse(stored) as PublicUserDto;
    } catch {
      // ignore parse error
    }
    return null;
  });

  // Never keep legacy auth tokens or users in persistent localStorage (FUG-02)
  useEffect(() => {
    localStorage.removeItem('roomia_auth_token');
    localStorage.removeItem('roomia_auth_user');
  }, []);

  // Verify existing session token against PostgreSQL 18 on mount
  useEffect(() => {
    const existingToken = getAuthToken();
    if (!existingToken) return;
    let active = true;
    void roomiaApi.fetchMe().then((res) => {
      if (!active) return;
      if (res.ok && res.data?.user) {
        setCurrentUser(res.data.user);
        setToken(existingToken);
        sessionStorage.setItem('roomia_auth_user', JSON.stringify(res.data.user));
      } else {
        setAuthToken(null);
        setToken(null);
        setCurrentUser(null);
        sessionStorage.removeItem('roomia_auth_user');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    const res = await roomiaApi.loginUser({ email, password });
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Credenciales inválidas.' };
    }
    const user = res.data.user || res.data.data;
    if (res.data.access_token) {
      setAuthToken(res.data.access_token);
      setToken(res.data.access_token);
    }
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('roomia_auth_user', JSON.stringify(user));
    }
    return { ok: true, user };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<AuthActionResult> => {
    const res = await roomiaApi.registerUser({ name, email, password, role });
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Error al registrar la cuenta.' };
    }
    const user = res.data.data || res.data.user;
    if (res.data.access_token) {
      setAuthToken(res.data.access_token);
      setToken(res.data.access_token);
    }
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('roomia_auth_user', JSON.stringify(user));
    }
    return { ok: true, user };
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setToken(null);
    sessionStorage.removeItem('roomia_auth_user');
    localStorage.removeItem('roomia_auth_user');
    localStorage.removeItem('roomia_auth_token');
  };

  const switchUserSim = (user: PublicUserDto) => {
    setCurrentUser(user);
    sessionStorage.setItem('roomia_auth_user', JSON.stringify(user));
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAdmin,
        login,
        register,
        logout,
        switchUserSim,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
