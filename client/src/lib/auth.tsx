import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Check if there's a saved user in localStorage
        const savedUser = localStorage.getItem('cedoi-user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            localStorage.removeItem('cedoi-user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('Login attempt for:', email);
      
      // Simple fallback - create mock user
      const user = {
        id: `user_${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        company: email.includes('sonai') ? 'CEDOI Administration' : 
                email.includes('chairman') ? 'CEDOI Board' : 'Guest Company',
        role: email.includes('sonai') ? 'sonai' : 
             email.includes('chairman') ? 'chairman' : 'member',
        qrCode: null,
        createdAt: new Date()
      };
      
      setUser(user);
      localStorage.setItem('cedoi-user', JSON.stringify(user));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      localStorage.removeItem('cedoi-user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}