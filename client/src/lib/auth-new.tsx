import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

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

        // Try Firebase Auth initialization
        try {
          const firebaseModule = await import('./firebase');
          const authFunctions = await import('firebase/auth');
          const firestoreModule = await import('./firestore');
          
          const firebaseAuth = firebaseModule.auth;
          const firestoreUsers = firestoreModule.firestoreUsers;

          if (firebaseAuth && authFunctions && firestoreUsers) {
            const unsubscribe = authFunctions.onAuthStateChanged(firebaseAuth, async (firebaseUser: any) => {
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
                } else {
                  setUser(null);
                  localStorage.removeItem('cedoi-user');
                }
              } catch (error) {
                console.error('Firebase auth state change error:', error);
              }
            });

            // Cleanup function
            return () => unsubscribe();
          }
        } catch (firebaseError) {
          console.log('Firebase modules not available:', firebaseError);
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
      
      // Try Firebase Auth first
      try {
        const firebaseModule = await import('./firebase');
        const authFunctions = await import('firebase/auth');
        const firestoreModule = await import('./firestore');
        
        const firebaseAuth = firebaseModule.auth;
        const firestoreUsers = firestoreModule.firestoreUsers;

        if (firebaseAuth && authFunctions) {
          try {
            await authFunctions.signInWithEmailAndPassword(firebaseAuth, email, password);
            console.log('Firebase login successful for:', email);
            return; // Exit early if Firebase login succeeds
          } catch (firebaseError: any) {
            console.log('Firebase auth failed:', firebaseError.message);
          }
        }

        // Fallback for development - try Firestore directly
        if (firestoreUsers) {
          let user = await firestoreUsers.getByEmail(email);
          
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
          
          setUser(user);
          localStorage.setItem('cedoi-user', JSON.stringify(user));
          return;
        }
      } catch (firebaseError) {
        console.log('Firebase/Firestore not available, using fallback');
      }
      
      // Final fallback - create mock user
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
      // Try Firebase logout
      try {
        const firebaseModule = await import('./firebase');
        const authFunctions = await import('firebase/auth');
        
        const firebaseAuth = firebaseModule.auth;
        if (firebaseAuth && authFunctions) {
          await authFunctions.signOut(firebaseAuth);
        }
      } catch (firebaseError) {
        console.log('Firebase logout not available');
      }
      
      // Clear local state
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
  return context;
}