// Frontend API layer using Firestore directly
import { firestoreUsers, firestoreMeetings, firestoreAttendance } from './firestore';
import type { User, Meeting, AttendanceRecord } from '@shared/schema';

export const api = {
  // Users
  users: {
    getAll: () => firestoreUsers.getAll(),
    getById: (id: string) => firestoreUsers.getById(id),
    getByEmail: (email: string) => firestoreUsers.getByEmail(email),
    create: (userData: Omit<User, 'id' | 'createdAt'>) => firestoreUsers.create(userData)
  },

  // Meetings
  meetings: {
    getAll: () => firestoreMeetings.getAll(),
    getById: (id: string) => firestoreMeetings.getById(id),
    getTodaysMeeting: () => firestoreMeetings.getTodaysMeeting(),
    getByUser: (userId: string) => firestoreMeetings.getByUser(userId),
    create: (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => firestoreMeetings.create(meetingData)
  },

  // Attendance
  attendance: {
    getForMeeting: (meetingId: string) => firestoreAttendance.getForMeeting(meetingId),
    updateStatus: (meetingId: string, userId: string, status: 'present' | 'absent') => 
      firestoreAttendance.updateStatus(meetingId, userId, status),
    getStats: (userId?: string) => firestoreAttendance.getStats(userId)
  }
};