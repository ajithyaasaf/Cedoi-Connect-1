// Test script to verify Firestore connection and populate initial data
import { firestoreUsers, firestoreMeetings, firestoreAttendance } from './firestore';

export async function testFirestoreConnection() {
  try {
    console.log('🔄 Testing Firestore connection...');
    
    // Test 1: Check if we can read from Firestore
    const users = await firestoreUsers.getAll();
    console.log('✅ Firestore read test passed. Users count:', users.length);
    
    // Test 2: If no users exist, create some initial data
    if (users.length === 0) {
      console.log('📝 No users found. Creating initial test data...');
      
      // Create chairman user
      const chairmanUser = await firestoreUsers.create({
        email: 'chairman@cedoi.com',
        name: 'Chairman',
        company: 'CEDOI Board',
        role: 'chairman',
        qrCode: 'chairman_qr_456'
      });
      console.log('✅ Created chairman user:', chairmanUser.id);
      
      // Create sonai user
      const sonaiUser = await firestoreUsers.create({
        email: 'sonai@cedoi.com',
        name: 'Sonai',
        company: 'CEDOI Administration',
        role: 'sonai',
        qrCode: 'sonai_qr_123'
      });
      console.log('✅ Created sonai user:', sonaiUser.id);
      
      // Create some member users
      const members = [
        {
          email: 'priya@cedoi.com',
          name: 'Priya Sharma',
          company: 'Tech Solutions Pvt Ltd',
          role: 'member',
          qrCode: 'priya_qr_789'
        },
        {
          email: 'rajesh.kumar@cedoi.com',
          name: 'Rajesh Kumar',
          company: 'Kumar Industries Ltd',
          role: 'member',
          qrCode: 'rajesh_qr_101'
        },
        {
          email: 'anita.singh@cedoi.com',
          name: 'Anita Singh',
          company: 'Singh Textiles',
          role: 'member',
          qrCode: 'anita_qr_102'
        }
      ];
      
      for (const memberData of members) {
        const member = await firestoreUsers.create(memberData);
        console.log(`✅ Created member user: ${member.name} (${member.id})`);
      }
      
      // Create a test meeting for today
      const today = new Date();
      today.setHours(14, 30, 0, 0); // Set to 2:30 PM today
      
      const meeting = await firestoreMeetings.create({
        date: today,
        venue: 'Mariat Hotel, Madurai',
        agenda: 'Monthly Forum Discussion and Business Updates',
        createdBy: chairmanUser.id,
        repeatWeekly: false,
        isActive: true
      });
      console.log('✅ Created test meeting:', meeting.id);
      
      console.log('🎉 Initial Firestore data setup complete!');
      return { success: true, usersCreated: 5, meetingsCreated: 1 };
    }
    
    // Test 3: Check meetings
    const meetings = await firestoreMeetings.getAll();
    console.log('✅ Meetings count:', meetings.length);
    
    return { success: true, usersCount: users.length, meetingsCount: meetings.length };
    
  } catch (error: any) {
    console.error('❌ Firestore test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Function to be called from browser console for testing
(window as any).testFirestore = testFirestoreConnection;