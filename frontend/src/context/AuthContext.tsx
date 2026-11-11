import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicUserDto, UserRole } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface AuthContextType {
  currentUser: PublicUserDto | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchUserSim: (user: PublicUserDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<PublicUserDto | null>(() => {
    try {
      const stored = localStorage.getItem('roomia_auth_user');
      if (stored) return JSON.parse(stored) as PublicUserDto;
    } catch {
      // ignore parse error
    }
    // Default initial user is a verified Guest
    return {
      id: 104,
      uuid: '10000000-0000-4000-8000-000000000104',
      name: 'Alejandro Mendoza',
      email: 'guest.alejandro@roomia.mx',
      role: 'GUEST',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-10-15T10:00:00.000Z',
      deletedAt: null,
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('roomia_auth_token') || 'jwt.simulated.token.v3.1';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('roomia_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('roomia_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('roomia_auth_token', token);
    } else {
      localStorage.removeItem('roomia_auth_token');
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await roomiaApi.loginUser({ email, password });
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Credenciales inválidas.' };
    }
    const user = res.data.user || res.data.data;
    if (user) {
      setCurrentUser(user);
    }
    if (res.data.access_token) {
      setToken(res.data.access_token);
    }
    return { ok: true };
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const res = await roomiaApi.registerUser({ name, email, password, role });
    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || 'Error al registrar la cuenta.' };
    }
    const user = res.data.data || res.data.user;
    if (user) {
      setCurrentUser(user);
    }
    if (res.data.access_token) {
      setToken(res.data.access_token);
    }
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('roomia_auth_user');
    localStorage.removeItem('roomia_auth_token');
  };

  const switchUserSim = (user: PublicUserDto) => {
    setCurrentUser(user);
    setToken(`jwt.simulated.${user.role.toLowerCase()}.${user.id}`);
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
