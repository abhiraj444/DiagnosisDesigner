'use client';

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { LocalDataService, type LocalUser } from '@/lib/LocalDataService';

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<boolean>;
  signup: (email: string, passwordHash: string, displayName: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('medigen_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, passwordHash: string) => {
    const user = await LocalDataService.getUserByEmail(email);
    if (user && user.passwordHash === passwordHash) {
      setUser(user);
      localStorage.setItem('medigen_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const signup = async (email: string, passwordHash: string, displayName: string) => {
    const existing = await LocalDataService.getUserByEmail(email);
    if (existing) return false;

    const newUser: LocalUser = {
      id: Math.random().toString(36).substring(2, 15),
      email,
      displayName,
      passwordHash
    };

    await LocalDataService.createUser(newUser);
    setUser(newUser);
    localStorage.setItem('medigen_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medigen_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
