import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Check if Firebase is properly configured
const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                          import.meta.env.VITE_FIREBASE_PROJECT_ID &&
                          import.meta.env.VITE_FIREBASE_API_KEY !== "demo-api-key" &&
                          import.meta.env.VITE_FIREBASE_API_KEY.length > 10;

export const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cedoi-forum.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cedoi-forum-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cedoi-forum-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Only initialize Firebase if properly configured
let app: any = null;
let db: any = null;
let auth: any = null;

if (hasFirebaseConfig || import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Connect to emulator if enabled
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('Connected to Firebase emulators');
      } catch (error) {
        console.log('Emulator already connected or not available');
      }
    }
    
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (error) {
    console.log('Firebase initialization failed:', error);
    // Set to null to ensure mock data fallback
    db = null;
    auth = null;
  }
} else {
  console.log('Firebase not configured - using mock data mode');
  console.log('Config check:', {
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    apiKeyLength: import.meta.env.VITE_FIREBASE_API_KEY?.length
  });
}

export { db, auth };

export default app;
