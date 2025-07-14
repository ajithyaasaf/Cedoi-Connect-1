import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
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
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // First check if there's a saved user in localStorage
        const savedUser = localStorage.getItem('cedoi-user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            localStorage.removeItem('cedoi-user');
          }
        }

        // Try to set up Firebase Auth listener (only if auth is available)
        if (auth) {
          try {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
              try {
                if (firebaseUser) {
                  // Try to get/create user in Firestore
                  let firestoreUser = await firestoreUsers.getByEmail(firebaseUser.email!);
                  
                  if (!firestoreUser) {
                    const userData = {
                      email: firebaseUser.email!,
                      name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                      company: firebaseUser.email!.includes('sonai') ? 'CEDOI Administration' : 
                              firebaseUser.email!.includes('chairman') ? 'CEDOI Board' : 'Member Company',
                      role: firebaseUser.email!.includes('sonai') ? 'sonai' : 
                           firebaseUser.email!.includes('chairman') ? 'chairman' : 'member',
                      qrCode: null
                    };
                    firestoreUser = await firestoreUsers.create(userData);
                  }
                  
                  setUser(firestoreUser);
                  localStorage.setItem('cedoi-user', JSON.stringify(firestoreUser));
                } else if (!savedUser) {
                  setUser(null);
                  localStorage.removeItem('cedoi-user');
                }
              } catch (error) {
                console.log('Firebase Auth available but Firestore failed, using local storage only');
              }
            });
            
            return () => unsubscribe();
          } catch (error) {
            console.log('Firebase Auth listener failed:', error);
          }
        } else {
          console.log('Firebase Auth not available, using local storage only');
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
      
      // Try Firebase Auth first (only if available)
      if (auth) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          console.log('Firebase login successful for:', email);
          // User will be set by the auth state change listener
          return; // Exit early if Firebase login succeeds
        } catch (firebaseError: any) {
          console.log('Firebase auth failed:', firebaseError.message);
        }
      } else {
        console.log('Firebase auth not available, using fallback');
      }

      // Fallback for development - create user with mock data or try Firestore directly
      let user;
      
      try {
        // Try to get user from Firestore directly
        user = await firestoreUsers.getByEmail(email);
        
        if (!user) {
          const userData = {
            email: email,
            name: email.split('@')[0],
            company: email.includes('sonai') ? 'CEDOI Administration' : 
                    email.includes('chairman') ? 'CEDOI Board' : 'Guest Company',
            role: email.includes('sonai') ? 'sonai' : 
                 email.includes('chairman') ? 'chairman' : 'member',
            qrCode: null
          };
          user = await firestoreUsers.create(userData);
        }
      } catch (firestoreError) {
        console.log('Firestore also not available, creating mock user');
        // Final fallback - create mock user
        user = {
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
      }
      
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
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.log('Firebase signout failed:', error);
      }
    }
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