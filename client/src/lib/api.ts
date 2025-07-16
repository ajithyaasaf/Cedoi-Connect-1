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
    email: "priya@cedoi.com",
    name: "Priya Sharma",
    company: "Tech Solutions Pvt Ltd",
    role: "member",
    qrCode: "priya_qr_789",
    createdAt: new Date()
  },
  {
    id: "4",
    email: "rajesh.kumar@cedoi.com",
    name: "Rajesh Kumar",
    company: "Kumar Industries Ltd",
    role: "member",
    qrCode: "rajesh_qr_101",
    createdAt: new Date()
  },
  {
    id: "5",
    email: "anita.singh@cedoi.com",
    name: "Anita Singh",
    company: "Singh Textiles",
    role: "member",
    qrCode: "anita_qr_102",
    createdAt: new Date()
  },
  {
    id: "6",
    email: "suresh.patel@cedoi.com",
    name: "Suresh Patel",
    company: "Patel Trading Co",
    role: "member",
    qrCode: "suresh_qr_103",
    createdAt: new Date()
  },
  {
    id: "7",
    email: "kavitha.reddy@cedoi.com",
    name: "Kavitha Reddy",
    company: "Reddy Enterprises",
    role: "member",
    qrCode: "kavitha_qr_104",
    createdAt: new Date()
  },
  {
    id: "8",
    email: "ramesh.gupta@cedoi.com",
    name: "Ramesh Gupta",
    company: "Gupta Steel Works",
    role: "member",
    qrCode: "ramesh_qr_105",
    createdAt: new Date()
  },
  {
    id: "9",
    email: "deepa.iyer@cedoi.com",
    name: "Deepa Iyer",
    company: "Iyer Consulting",
    role: "member",
    qrCode: "deepa_qr_106",
    createdAt: new Date()
  },
  {
    id: "10",
    email: "vijay.mehta@cedoi.com",
    name: "Vijay Mehta",
    company: "Mehta Electronics",
    role: "member",
    qrCode: "vijay_qr_107",
    createdAt: new Date()
  },
  {
    id: "11",
    email: "sunita.shah@cedoi.com",
    name: "Sunita Shah",
    company: "Shah Jewelers",
    role: "member",
    qrCode: "sunita_qr_108",
    createdAt: new Date()
  },
  {
    id: "12",
    email: "arun.nair@cedoi.com",
    name: "Arun Nair",
    company: "Nair Construction",
    role: "member",
    qrCode: "arun_qr_109",
    createdAt: new Date()
  },
  {
    id: "13",
    email: "meera.joshi@cedoi.com",
    name: "Meera Joshi",
    company: "Joshi Pharmaceuticals",
    role: "member",
    qrCode: "meera_qr_110",
    createdAt: new Date()
  },
  {
    id: "14",
    email: "ravi.krishnan@cedoi.com",
    name: "Ravi Krishnan",
    company: "Krishnan Auto Parts",
    role: "member",
    qrCode: "ravi_qr_111",
    createdAt: new Date()
  },
  {
    id: "15",
    email: "lakshmi.pillai@cedoi.com",
    name: "Lakshmi Pillai",
    company: "Pillai Foods",
    role: "member",
    qrCode: "lakshmi_qr_112",
    createdAt: new Date()
  },
  {
    id: "16",
    email: "gopal.rao@cedoi.com",
    name: "Gopal Rao",
    company: "Rao Logistics",
    role: "member",
    qrCode: "gopal_qr_113",
    createdAt: new Date()
  },
  {
    id: "17",
    email: "sita.venkat@cedoi.com",
    name: "Sita Venkat",
    company: "Venkat Exports",
    role: "member",
    qrCode: "sita_qr_114",
    createdAt: new Date()
  },
  {
    id: "18",
    email: "mohan.das@cedoi.com",
    name: "Mohan Das",
    company: "Das Chemicals",
    role: "member",
    qrCode: "mohan_qr_115",
    createdAt: new Date()
  },
  {
    id: "19",
    email: "nisha.bansal@cedoi.com",
    name: "Nisha Bansal",
    company: "Bansal Fashion House",
    role: "member",
    qrCode: "nisha_qr_116",
    createdAt: new Date()
  },
  {
    id: "20",
    email: "arjun.mishra@cedoi.com",
    name: "Arjun Mishra",
    company: "Mishra Tech Solutions",
    role: "member",
    qrCode: "arjun_qr_117",
    createdAt: new Date()
  },
  {
    id: "21",
    email: "divya.agarwal@cedoi.com",
    name: "Divya Agarwal",
    company: "Agarwal Imports",
    role: "member",
    qrCode: "divya_qr_118",
    createdAt: new Date()
  },
  {
    id: "22",
    email: "kiran.bhat@cedoi.com",
    name: "Kiran Bhat",
    company: "Bhat Hospitality",
    role: "member",
    qrCode: "kiran_qr_119",
    createdAt: new Date()
  }
];

const mockMeetings: Meeting[] = [
  {
    id: "1",
    date: new Date(),
    venue: "Mariat Hotel, Madurai",
    agenda: "Monthly Forum Discussion",
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