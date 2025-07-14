// Frontend API layer using Firestore directly
import { firestoreUsers, firestoreMeetings, firestoreAttendance } from './firestore';
import type { User, Meeting, AttendanceRecord } from '@shared/schema';

export const api = {
  // User operations
  users: {
    getAll: () => firestoreUsers.getAll(),
    getById: (id: string) => firestoreUsers.getById(id),
    getByEmail: (email: string) => firestoreUsers.getByEmail(email),
    create: (userData: Omit<User, 'id' | 'createdAt'>) => firestoreUsers.create(userData)
  },

  // Meeting operations  
  meetings: {
    getAll: () => firestoreMeetings.getAll(),
    getById: (id: string) => firestoreMeetings.getById(id),
    getTodaysMeeting: () => firestoreMeetings.getTodaysMeeting(),
    getByUser: (userId: string) => firestoreMeetings.getByUser(userId),
    create: (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => firestoreMeetings.create(meetingData)
  },

  // Attendance operations
  attendance: {
    getForMeeting: (meetingId: string) => firestoreAttendance.getForMeeting(meetingId),
    create: (attendanceData: Omit<AttendanceRecord, 'id' | 'timestamp'>) => firestoreAttendance.create(attendanceData),
    updateStatus: (meetingId: string, userId: string, status: 'present' | 'absent') => 
      firestoreAttendance.updateStatus(meetingId, userId, status),
    getStats: (userId?: string) => firestoreAttendance.getStats(userId),
  },
};