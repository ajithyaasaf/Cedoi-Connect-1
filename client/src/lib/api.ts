// API layer that uses Firestore with fallback to mock data for development
import type { User, Meeting, AttendanceRecord } from '@shared/schema';
import { firestoreUsers, firestoreMeetings, firestoreAttendance } from './firestore';

// Mock data for development
const mockUsers: User[] = [
  {
    id: "1",
    email: "sonai@cedoi.com",
    name: "Sonai",
    company: "CEDOI Administration",
    role: "sonai",
    qrCode: "sonai_qr_123",
    createdAt: new Date()
  },
  {
    id: "2", 
    email: "chairman@cedoi.com",
    name: "Chairman",
    company: "CEDOI Board",
    role: "chairman",
    qrCode: "chairman_qr_456",
    createdAt: new Date()
  },
  {
    id: "3",
    email: "andrew.ananth@cedoi.com",
    name: "Andrew Ananth",
    company: "Godivatech",
    role: "member",
    qrCode: "andrew_qr_789",
    createdAt: new Date()
  },
  {
    id: "4",
    email: "dr.aafaq@cedoi.com",
    name: "Dr Aafaq",
    company: "zaara dentistry",
    role: "member",
    qrCode: "aafaq_qr_101",
    createdAt: new Date()
  },
  {
    id: "5",
    email: "vignesh.pavin@cedoi.com",
    name: "Vignesh",
    company: "Pavin caters",
    role: "member",
    qrCode: "vignesh_p_qr_102",
    createdAt: new Date()
  },
  {
    id: "6",
    email: "vignesh.aloka@cedoi.com",
    name: "Vignesh",
    company: "Aloka Events",
    role: "member",
    qrCode: "vignesh_a_qr_103",
    createdAt: new Date()
  },
  {
    id: "7",
    email: "imran@cedoi.com",
    name: "Imran",
    company: "MK Trading",
    role: "member",
    qrCode: "imran_qr_104",
    createdAt: new Date()
  },
  {
    id: "8",
    email: "radha.krishnan@cedoi.com",
    name: "Radha Krishnan",
    company: "Surya Crackers",
    role: "member",
    qrCode: "radha_qr_105",
    createdAt: new Date()
  },
  {
    id: "9",
    email: "mukesh@cedoi.com",
    name: "Mukesh",
    company: "Tamilnadu Electricals",
    role: "member",
    qrCode: "mukesh_qr_106",
    createdAt: new Date()
  },
  {
    id: "10",
    email: "shanmuga.pandiyan@cedoi.com",
    name: "Shanmuga Pandiyan",
    company: "Shree Mariamma Group",
    role: "member",
    qrCode: "shanmuga_qr_107",
    createdAt: new Date()
  },
  {
    id: "11",
    email: "muthukumar@cedoi.com",
    name: "Muthukumar",
    company: "PR Systems",
    role: "member",
    qrCode: "muthukumar_qr_108",
    createdAt: new Date()
  },
  {
    id: "12",
    email: "prabu@cedoi.com",
    name: "Prabu",
    company: "Cleaning solutions",
    role: "member",
    qrCode: "prabu_qr_109",
    createdAt: new Date()
  },
  {
    id: "13",
    email: "jaffer@cedoi.com",
    name: "Jaffer",
    company: "Spice King",
    role: "member",
    qrCode: "jaffer_qr_110",
    createdAt: new Date()
  }
];

const mockMeetings: Meeting[] = [
  {
    id: "1",
    date: new Date(),
    endTime: null,
    venue: "Mariat Hotel, Madurai",
    theme: "Monthly Forum Discussion",
    createdBy: "1",
    repeatWeekly: false,
    isActive: true,
    createdAt: new Date()
  }
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: "1",
    meetingId: "1",
    userId: "1",
    status: "present",
    timestamp: new Date()
  }
];

// Helper function to use Firestore with fallback to mock data
async function withFirestoreFallback<T>(
  firestoreOperation: () => Promise<T>,
  mockFallback: () => T | Promise<T>
): Promise<T> {
  try {
    // Add a timeout to prevent hanging on connection issues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore operation timeout')), 5000);
    });
    
    const result = await Promise.race([
      firestoreOperation(),
      timeoutPromise
    ]);
    
    return result;
  } catch (error: any) {
    console.log('Firestore operation failed, using mock data:', error.message || error);
    return await mockFallback();
  }
}

export const api = {
  // User operations
  users: {
    getAll: async () => withFirestoreFallback(
      () => firestoreUsers.getAll(),
      () => mockUsers
    ),
    getById: async (id: string) => withFirestoreFallback(
      () => firestoreUsers.getById(id),
      () => mockUsers.find(u => u.id === id) || null
    ),
    getByEmail: async (email: string) => withFirestoreFallback(
      () => firestoreUsers.getByEmail(email),
      () => mockUsers.find(u => u.email === email) || null
    ),
    deleteAll: async () => withFirestoreFallback(
      () => firestoreUsers.deleteAll(),
      () => { 
        const count = mockUsers.length;
        mockUsers.length = 0; // Clear mock users
        return count;
      }
    ),
    bulkCreate: async (users: Omit<User, 'id' | 'createdAt'>[]) => withFirestoreFallback(
      () => firestoreUsers.bulkCreate(users),
      () => {
        const newUsers = users.map((userData, index) => ({
          id: `user_${Date.now()}_${index}`,
          ...userData,
          createdAt: new Date()
        }));
        mockUsers.push(...newUsers);
        return newUsers;
      }
    ),
    create: async (userData: Omit<User, 'id' | 'createdAt'>) => withFirestoreFallback(
      () => firestoreUsers.create(userData),
      () => {
        const newUser: User = {
          id: `user_${Date.now()}`,
          ...userData,
          createdAt: new Date()
        };
        mockUsers.push(newUser);
        return newUser;
      }
    )
  },

  // Meeting operations  
  meetings: {
    getAll: async () => withFirestoreFallback(
      () => firestoreMeetings.getAll(),
      () => mockMeetings
    ),
    getById: async (id: string) => withFirestoreFallback(
      () => firestoreMeetings.getById(id),
      () => mockMeetings.find(m => m.id === id) || null
    ),
    getTodaysMeeting: async () => withFirestoreFallback(
      async () => {
        console.log('API: Attempting Firestore getTodaysMeeting...');
        const result = await firestoreMeetings.getTodaysMeeting();
        console.log('API: Firestore getTodaysMeeting result:', result);
        return result;
      },
      async () => {
        console.log('API: Firestore getTodaysMeeting failed, using getAll() to find today\'s meeting...');
        // Fallback: Use getAll() and filter for today's meeting
        try {
          const allMeetings = await firestoreMeetings.getAll();
          console.log('API: Got all meetings from Firestore for today filter:', allMeetings);
          
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          
          const todaysMeeting = allMeetings.find(m => {
            const meetingDate = new Date(m.date);
            return meetingDate >= todayStart && meetingDate < todayEnd && m.isActive;
          });
          
          console.log('API: Found today\'s meeting from getAll():', todaysMeeting);
          return todaysMeeting || null;
        } catch (error) {
          console.log('API: Firestore getAll() also failed, using mock data:', error);
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          
          return mockMeetings.find(m => 
            m.date >= todayStart && m.date < todayEnd && m.isActive
          ) || null;
        }
      }
    ),
    getByUser: async (userId: string) => withFirestoreFallback(
      () => firestoreMeetings.getByUser(userId),
      () => mockMeetings.filter(m => m.createdBy === userId)
    ),
    create: async (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => withFirestoreFallback(
      () => firestoreMeetings.create(meetingData),
      () => {
        const newMeeting: Meeting = {
          id: `meeting_${Date.now()}`,
          ...meetingData,
          createdAt: new Date()
        };
        mockMeetings.push(newMeeting);
        return newMeeting;
      }
    )
  },

  // Attendance operations
  attendance: {
    getForMeeting: async (meetingId: string) => withFirestoreFallback(
      () => firestoreAttendance.getForMeeting(meetingId),
      () => mockAttendance.filter(a => a.meetingId === meetingId)
    ),
    create: async (attendanceData: Omit<AttendanceRecord, 'id' | 'timestamp'>) => withFirestoreFallback(
      () => firestoreAttendance.create(attendanceData),
      () => {
        const newRecord: AttendanceRecord = {
          id: `attendance_${Date.now()}`,
          ...attendanceData,
          timestamp: new Date()
        };
        mockAttendance.push(newRecord);
        return newRecord;
      }
    ),
    updateStatus: async (meetingId: string, userId: string, status: 'present' | 'absent') => withFirestoreFallback(
      () => firestoreAttendance.updateStatus(meetingId, userId, status),
      () => {
        const existingIndex = mockAttendance.findIndex(
          a => a.meetingId === meetingId && a.userId === userId
        );
        
        if (existingIndex >= 0) {
          mockAttendance[existingIndex].status = status;
          mockAttendance[existingIndex].timestamp = new Date();
          return mockAttendance[existingIndex];
        } else {
          const newRecord: AttendanceRecord = {
            id: `attendance_${Date.now()}`,
            meetingId,
            userId,
            status,
            timestamp: new Date()
          };
          mockAttendance.push(newRecord);
          return newRecord;
        }
      }
    ),
    getStats: async (userId?: string) => withFirestoreFallback(
      () => firestoreAttendance.getStats(userId),
      () => {
        const relevantRecords = userId 
          ? mockAttendance.filter(a => a.userId === userId)
          : mockAttendance;
        
        // Remove duplicates per user per meeting (keep latest status)
        const uniqueRecords = new Map();
        relevantRecords.forEach(record => {
          const key = `${record.meetingId}-${record.userId}`;
          uniqueRecords.set(key, record);
        });
        
        const dedupedRecords = Array.from(uniqueRecords.values());
        const totalMeetings = new Set(dedupedRecords.map(r => r.meetingId)).size;
        const presentCount = dedupedRecords.filter(r => r.status === 'present').length;
        const absentCount = dedupedRecords.filter(r => r.status === 'absent').length;
        const totalRecords = dedupedRecords.length;
        
        // Calculate attendance percentage based on present vs total attendance records
        const averageAttendance = totalRecords > 0 ? Math.min(100, (presentCount / totalRecords) * 100) : 0;
        
        return {
          totalMeetings,
          averageAttendance: Math.round(averageAttendance * 100) / 100,
          presentCount,
          absentCount
        };
      }
    ),
  },
};