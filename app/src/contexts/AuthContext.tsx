'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { authApi } from '@/lib/api/auth';
import type { User, Firm, AuthState, LoginPayload, RegisterPayload } from '@/types';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      const userData = res.data.data.user;
      setUser(userData);
      setFirm(userData.firm || null);
    } catch {
      setUser(null);
      setFirm(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    const userData = res.data.data.user;
    setUser(userData);
    setFirm(userData.firm || null);
    message.success('Welcome back!');
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    const userData = res.data.data.user;
    setUser(userData);
    setFirm(userData.firm || null);
    message.success('Account created successfully!');
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setFirm(null);
    message.success('Logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firm,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
