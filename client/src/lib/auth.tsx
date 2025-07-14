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
      console.log('Login attempt for:', email);
      
      // For demo purposes, create a simple user without Firestore dependency
      // TODO: Implement real Firestore authentication when Firebase is configured
      const mockUser: User = {
        id: `user_${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        company: email.includes('sonai') ? 'CEDOI Administration' : email.includes('chairman') ? 'CEDOI Board' : 'Guest Company',
        role: email.includes('sonai') ? 'sonai' : email.includes('chairman') ? 'chairman' : 'member',
        qrCode: null,
        createdAt: new Date()
      };
      
      console.log('Login successful for user:', mockUser);
      setUser(mockUser);
      localStorage.setItem('cedoi-user', JSON.stringify(mockUser));
    } catch (error: any) {
      console.error('Login error:', error);
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