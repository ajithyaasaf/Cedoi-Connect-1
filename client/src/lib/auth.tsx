import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('cedoi-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('cedoi-user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Try to find existing user in Firestore or create new one
      const { api } = await import('@/lib/api');
      let existingUser = await api.users.getByEmail(email);
      
      if (!existingUser) {
        // Create new user in Firestore
        existingUser = await api.users.create({
          email: email,
          name: email.split('@')[0],
          role: email.includes('sonai') ? 'sonai' : email.includes('chairman') ? 'chairman' : 'member',
          qrCode: null,
        });
      }
      
      setUser(existingUser);
      localStorage.setItem('cedoi-user', JSON.stringify(existingUser));
    } catch (error: any) {
      throw new Error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('cedoi-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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