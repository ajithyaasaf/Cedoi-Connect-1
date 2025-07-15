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
        // Use Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // User data will be set by the onAuthStateChanged listener
        console.log('Firebase login successful for:', userCredential.user.email);
      } else {
        // Fallback authentication for development
        console.log('Firebase not available, using fallback authentication');
        
        // Validate credentials against known users
        const existingUser = await api.users.getByEmail(email);
        let userData = existingUser;
        
        if (!userData) {
          // Create new user
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
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw new Error('Login failed: ' + (error.message || 'Unknown error'));
      }
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