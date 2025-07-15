import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';
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
    let unsubscribe = () => {};
    
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        if (auth) {
          // Set up Firebase Auth state listener
          unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              // User is signed in - get or create user data in Firestore
              try {
                let userData = await api.users.getByEmail(firebaseUser.email!);
                
                if (!userData) {
                  // Create new user in Firestore
                  userData = await api.users.create({
                    email: firebaseUser.email!,
                    name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                    company: firebaseUser.email!.includes('sonai') ? 'CEDOI Administration' : 
                            firebaseUser.email!.includes('chairman') ? 'CEDOI Board' : 'Member Company',
                    role: firebaseUser.email!.includes('sonai') ? 'sonai' : 
                         firebaseUser.email!.includes('chairman') ? 'chairman' : 'member',
                    qrCode: null
                  });
                }
                
                setUser(userData);
                localStorage.setItem('cedoi-user', JSON.stringify(userData));
              } catch (error) {
                console.error('Error fetching user data:', error);
                setUser(null);
              }
            } else {
              // User is signed out
              setUser(null);
              localStorage.removeItem('cedoi-user');
            }
            setLoading(false);
          });
        } else {
          // Fallback to localStorage if Firebase is not available
          const savedUser = localStorage.getItem('cedoi-user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
            } catch {
              localStorage.removeItem('cedoi-user');
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('Login attempt for:', email);
      
      if (auth) {
        // Try Firebase Authentication first
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          // User data will be set by the onAuthStateChanged listener
          console.log('Firebase login successful for:', userCredential.user.email);
          return; // Success - exit early
        } catch (firebaseError: any) {
          console.log('Firebase auth failed, falling back to development mode:', firebaseError.message);
          // Fall through to development authentication
        }
      }
      
      // Development/Fallback authentication - accepts any password
      console.log('Using development authentication mode');
      
      // Basic email validation
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 1) {
        throw new Error('Please enter a password');
      }
      
      // Get or create user in Firestore/mock data
      let userData = await api.users.getByEmail(email);
      
      if (!userData) {
        // Create new user
        console.log('Creating new user for:', email);
        userData = await api.users.create({
          email: email,
          name: email.split('@')[0],
          company: email.includes('sonai') ? 'CEDOI Administration' : 
                  email.includes('chairman') ? 'CEDOI Board' : 'Member Company',
          role: email.includes('sonai') ? 'sonai' : 
               email.includes('chairman') ? 'chairman' : 'member',
          qrCode: null
        });
      }
      
      setUser(userData);
      localStorage.setItem('cedoi-user', JSON.stringify(userData));
      console.log('Development login successful for:', email, 'with role:', userData.role);
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (auth) {
        await signOut(auth);
        // User state will be cleared by the onAuthStateChanged listener
      } else {
        // Fallback logout
        setUser(null);
        localStorage.removeItem('cedoi-user');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      setUser(null);
      localStorage.removeItem('cedoi-user');
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