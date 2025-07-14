import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from './firebase';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const savedUser = localStorage.getItem('cedoi-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const sendOTP = async (email: string): Promise<void> => {
    await auth.sendOTP(email);
  };

  const login = async (email: string, otp: string): Promise<void> => {
    try {
      const user = await auth.verifyOTP(email, otp);
      setUser(user);
      localStorage.setItem('cedoi-user', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    await auth.signOut();
    setUser(null);
    localStorage.removeItem('cedoi-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sendOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
