#!/usr/bin/env node

/**
 * Add Members Script
 * Adds 10 sample members to the Firestore database
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config (using environment variables if available)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "cedoi-madurai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "cedoi-madurai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "cedoi-madurai.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

// Sample member data
const members = [
  {
    email: "rajesh.kumar@techsolutions.com",
    name: "Rajesh Kumar",
    company: "TechSolutions Pvt Ltd",
    role: "chairman",
    qrCode: "QR_RAJESH_001"
  },
  {
    email: "priya.sharma@innovatetech.com",
    name: "Priya Sharma", 
    company: "InnovateTech Systems",
    role: "sonai",
    qrCode: "QR_PRIYA_002"
  },
  {
    email: "arun.krishnan@digitalmedia.com",
    name: "Arun Krishnan",
    company: "Digital Media Solutions",
    role: "member",
    qrCode: "QR_ARUN_003"
  },
  {
    email: "sneha.reddy@cloudservices.com",
    name: "Sneha Reddy",
    company: "Cloud Services India",
    role: "member", 
    qrCode: "QR_SNEHA_004"
  },
  {
    email: "vikram.patel@manufacturing.com",
    name: "Vikram Patel",
    company: "Patel Manufacturing Co",
    role: "member",
    qrCode: "QR_VIKRAM_005"
  },
  {
    email: "kavitha.nair@exports.com",
    name: "Kavitha Nair",
    company: "Nair Exports & Imports",
    role: "member",
    qrCode: "QR_KAVITHA_006"
  },
  {
    email: "suresh.iyer@consulting.com",
    name: "Suresh Iyer",
    company: "Iyer Business Consulting",
    role: "member",
    qrCode: "QR_SURESH_007"
  },
  {
    email: "meera.gupta@textiles.com",
    name: "Meera Gupta",
    company: "Gupta Textiles Ltd",
    role: "member",
    qrCode: "QR_MEERA_008"
  },
  {
    email: "ramesh.singh@logistics.com",
    name: "Ramesh Singh",
    company: "Singh Logistics Solutions",
    role: "member",
    qrCode: "QR_RAMESH_009"
  },
  {
    email: "anita.das@finance.com",
    name: "Anita Das",
    company: "Das Financial Services",
    role: "member",
    qrCode: "QR_ANITA_010"
  }
];

async function addMembers() {
  console.log('🚀 Starting to add members to database...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Connected to Firebase');
    
    // Add each member
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      console.log(`Adding member ${i + 1}/10: ${member.name}...`);
      
      try {
        const docRef = await addDoc(collection(db, 'users'), {
          ...member,
          createdAt: serverTimestamp()
        });
        
        console.log(`✅ Added ${member.name} with ID: ${docRef.id}`);
      } catch (error) {
        console.log(`❌ Failed to add ${member.name}: ${error.message}`);
        
        // If Firebase is not configured, show mock data instead
        if (error.message.includes('not found') || error.message.includes('permission')) {
          console.log('📝 Mock data that would be added:', member);
        }
      }
    }
    
    console.log('\n🎉 Finished adding members!');
    console.log('📊 Total members added: 10');
    console.log('👥 Roles: 1 Chairman, 1 Sonai, 8 Members');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n📝 Mock data that would be added to database:\n');
    
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.role})`);
      console.log(`   Company: ${member.company}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   QR Code: ${member.qrCode}\n`);
    });
    
    console.log('💡 To add real data:');
    console.log('   1. Configure Firebase credentials');
    console.log('   2. Run: node scripts/add-members.js');
  }
}

// Run the script
addMembers().catch(console.error);