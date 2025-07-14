// Temporary mock API for development - will switch to Firestore when configured
import type { User, Meeting, AttendanceRecord } from '@shared/schema';

// Mock data for development
const mockUsers: User[] = [
  {
    id: "1",
    email: "sonai@cedoi.com",
    name: "Sonai",
    role: "sonai",
    qrCode: "sonai_qr_123",
    createdAt: new Date()
  },
  {
    id: "2", 
    email: "chairman@cedoi.com",
    name: "Chairman",
    role: "chairman",
    qrCode: "chairman_qr_456",
    createdAt: new Date()
  },
  {
    id: "3",
    email: "priya@cedoi.com",
    name: "Priya Sharma",
    role: "member",
    qrCode: "priya_qr_789",
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

export const api = {
  // User operations
  users: {
    getAll: async () => mockUsers,
    getById: async (id: string) => mockUsers.find(u => u.id === id) || null,
    getByEmail: async (email: string) => mockUsers.find(u => u.email === email) || null,
    create: async (userData: Omit<User, 'id' | 'createdAt'>) => {
      const newUser: User = {
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date()
      };
      mockUsers.push(newUser);
      return newUser;
    }
  },

  // Meeting operations  
  meetings: {
    getAll: async () => mockMeetings,
    getById: async (id: string) => mockMeetings.find(m => m.id === id) || null,
    getTodaysMeeting: async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      return mockMeetings.find(m => 
        m.date >= todayStart && m.date < todayEnd && m.isActive
      ) || null;
    },
    getByUser: async (userId: string) => mockMeetings.filter(m => m.createdBy === userId),
    create: async (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => {
      const newMeeting: Meeting = {
        id: `meeting_${Date.now()}`,
        ...meetingData,
        createdAt: new Date()
      };
      mockMeetings.push(newMeeting);
      return newMeeting;
    }
  },

  // Attendance operations
  attendance: {
    getForMeeting: async (meetingId: string) => 
      mockAttendance.filter(a => a.meetingId === meetingId),
    create: async (attendanceData: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
      const newRecord: AttendanceRecord = {
        id: `attendance_${Date.now()}`,
        ...attendanceData,
        timestamp: new Date()
      };
      mockAttendance.push(newRecord);
      return newRecord;
    },
    updateStatus: async (meetingId: string, userId: string, status: 'present' | 'absent') => {
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
    },
    getStats: async (userId?: string) => {
      const relevantRecords = userId 
        ? mockAttendance.filter(a => a.userId === userId)
        : mockAttendance;
      
      const totalMeetings = new Set(relevantRecords.map(r => r.meetingId)).size;
      const presentCount = relevantRecords.filter(r => r.status === 'present').length;
      const absentCount = relevantRecords.filter(r => r.status === 'absent').length;
      const averageAttendance = totalMeetings > 0 ? (presentCount / totalMeetings) * 100 : 0;
      
      return {
        totalMeetings,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        presentCount,
        absentCount
      };
    },
  },
};