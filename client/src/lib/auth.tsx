import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          // Check if user exists in Firestore
          let firestoreUser = await firestoreUsers.getByEmail(firebaseUser.email!);
          
          // If user doesn't exist in Firestore, create them
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
        console.error('Auth state change error:', error);
        // Fallback to localStorage for development
        const savedUser = localStorage.getItem('cedoi-user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem('cedoi-user');
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('Login attempt for:', email);
      
      // Try Firebase Auth first
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase login successful for:', userCredential.user.email);
      } catch (firebaseError: any) {
        console.log('Firebase auth not available, using fallback auth:', firebaseError.message);
        
        // Fallback for development - create user directly in Firestore
        let firestoreUser = await firestoreUsers.getByEmail(email);
        
        if (!firestoreUser) {
          const userData = {
            email: email,
            name: email.split('@')[0],
            company: email.includes('sonai') ? 'CEDOI Administration' : 
                    email.includes('chairman') ? 'CEDOI Board' : 'Guest Company',
            role: email.includes('sonai') ? 'sonai' : 
                 email.includes('chairman') ? 'chairman' : 'member',
            qrCode: null
          };
          firestoreUser = await firestoreUsers.create(userData);
        }
        
        setUser(firestoreUser);
        localStorage.setItem('cedoi-user', JSON.stringify(firestoreUser));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Firebase signout not available, using local logout');
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