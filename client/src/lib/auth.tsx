import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firestoreUsers } from './firestore';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const savedUser = localStorage.getItem('cedoi-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user from Firestore
      let firestoreUser = await firestoreUsers.getByEmail(email);
      
      // If user doesn't exist in Firestore, create them
      if (!firestoreUser) {
        // Default to 'member' role, can be changed by admin later
        const name = email.split('@')[0];
        const role = email.includes('sonai') ? 'sonai' : email.includes('chairman') ? 'chairman' : 'member';
        
        firestoreUser = await firestoreUsers.create({
          email,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          role,
          qrCode: null
        });
      }
      
      setUser(firestoreUser);
      localStorage.setItem('cedoi-user', JSON.stringify(firestoreUser));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
