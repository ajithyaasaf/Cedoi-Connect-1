// Script to seed Firestore with initial test data
// Run this script after setting up Firebase credentials

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration - update with your actual project details
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "cedoi-forum.firebaseapp.com", 
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "cedoi-forum-demo",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "cedoi-forum-demo.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users data
const users = [
  {
    email: "sonai@cedoi.com",
    name: "Sonai",
    company: "CEDOI Administration",
    role: "sonai",
    qrCode: "sonai_qr_123"
  },
  {
    email: "chairman@cedoi.com",
    name: "Chairman",
    company: "CEDOI Board",
    role: "chairman", 
    qrCode: "chairman_qr_456"
  },
  {
    email: "priya@cedoi.com",
    name: "Priya Sharma",
    company: "Tech Solutions Pvt Ltd",
    role: "member",
    qrCode: "priya_qr_789"
  },
  {
    email: "rajesh.kumar@cedoi.com",
    name: "Rajesh Kumar",
    company: "Kumar Industries Ltd",
    role: "member",
    qrCode: "rajesh_qr_101"
  },
  {
    email: "anita.singh@cedoi.com",
    name: "Anita Singh",
    company: "Singh Textiles",
    role: "member",
    qrCode: "anita_qr_102"
  }
];

// Sample meeting data
const meeting = {
  date: new Date(),
  venue: "Mariat Hotel, Madurai",
  agenda: "Monthly Forum Discussion",
  createdBy: "user_1", // Will be updated after creating users
  repeatWeekly: false,
  isActive: true
};

async function seedData() {
  try {
    console.log('Starting to seed Firestore data...');

    // Add users
    console.log('Adding users...');
    const userIds = [];
    for (const user of users) {
      const docRef = await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: serverTimestamp()
      });
      userIds.push(docRef.id);
      console.log(`Added user: ${user.name} with ID: ${docRef.id}`);
    }

    // Add meeting (using first user as creator)
    console.log('Adding meeting...');
    const meetingRef = await addDoc(collection(db, 'meetings'), {
      ...meeting,
      createdBy: userIds[0], // Use first user as creator
      date: new Date(),
      createdAt: serverTimestamp()
    });
    console.log(`Added meeting with ID: ${meetingRef.id}`);

    // Add some attendance records
    console.log('Adding attendance records...');
    for (let i = 0; i < 3; i++) {
      await addDoc(collection(db, 'attendance_records'), {
        meetingId: meetingRef.id,
        userId: userIds[i],
        status: i === 0 ? 'present' : 'absent',
        timestamp: serverTimestamp()
      });
    }

    console.log('✅ Successfully seeded Firestore data!');
    console.log('You can now use the application with real Firestore data.');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.log('Make sure your Firebase credentials are properly configured.');
  }
}

// Run the seeding function
seedData();