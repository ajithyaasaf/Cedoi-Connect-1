#!/usr/bin/env node

/**
 * Test Firebase Connectivity
 * Tests if we can read the users we added earlier
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "cedoi-madurai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "cedoi-madurai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "cedoi-madurai.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

async function testFirestore() {
  console.log('🔥 Testing Firestore connection...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized');
    
    // Test reading users collection
    console.log('📖 Reading users collection...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore');
      console.log('💡 This means the users we added earlier might not be in the correct database');
      console.log('   or there might be a permissions issue');
    } else {
      console.log(`✅ Found ${usersSnapshot.size} users in Firestore:`);
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name} (${data.email}) - ${data.role}`);
      });
    }
    
    // Test reading meetings collection
    console.log('\n📖 Reading meetings collection...');
    const meetingsSnapshot = await getDocs(collection(db, 'meetings'));
    
    if (meetingsSnapshot.empty) {
      console.log('❌ No meetings found in Firestore');
    } else {
      console.log(`✅ Found ${meetingsSnapshot.size} meetings in Firestore:`);
      meetingsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - Meeting at ${data.venue} on ${data.date?.toDate?.() || data.date}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Firestore test failed:', error.message);
    console.log('💡 This could mean:');
    console.log('   1. Firebase credentials are incorrect');
    console.log('   2. Firestore rules are blocking access');
    console.log('   3. Network connectivity issues');
    console.log('   4. The project ID doesn\'t match');
    
    // Show what config we're using
    console.log('\n🔧 Current Firebase config:');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);
    console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
    console.log(`   API Key: ${firebaseConfig.apiKey.substring(0, 10)}...`);
  }
}

// Run the test
testFirestore().catch(console.error);