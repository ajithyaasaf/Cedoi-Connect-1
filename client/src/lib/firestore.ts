import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Meeting, AttendanceRecord } from '@shared/schema';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  MEETINGS: 'meetings',
  ATTENDANCE: 'attendance_records'
};

// User operations
export const firestoreUsers = {
  async create(userData: Omit<User, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      ...userData,
      createdAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as User;
  },

  async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  async getByEmail(email: string) {
    const q = query(
      collection(db, COLLECTIONS.USERS), 
      where('email', '==', email),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  },

  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as User[];
  }
};

// Meeting operations
export const firestoreMeetings = {
  async create(meetingData: Omit<Meeting, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.MEETINGS), {
      ...meetingData,
      date: Timestamp.fromDate(new Date(meetingData.date)),
      createdAt: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Meeting;
  },

  async getById(id: string) {
    const docRef = doc(db, COLLECTIONS.MEETINGS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        date: data.date.toDate() // Convert Timestamp to Date
      } as Meeting;
    }
    return null;
  },

  async getAll() {
    const q = query(
      collection(db, COLLECTIONS.MEETINGS),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        date: data.date.toDate() // Convert Timestamp to Date
      };
    }) as Meeting[];
  },

  async getTodaysMeeting() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const q = query(
      collection(db, COLLECTIONS.MEETINGS),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<', Timestamp.fromDate(endOfDay)),
      where('isActive', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        date: data.date.toDate() // Convert Timestamp to Date
      } as Meeting;
    }
    return null;
  },

  async getByUser(userId: string) {
    const q = query(
      collection(db, COLLECTIONS.MEETINGS),
      where('createdBy', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        date: data.date.toDate() // Convert Timestamp to Date
      };
    }) as Meeting[];
  }
};

// Attendance operations
export const firestoreAttendance = {
  async create(attendanceData: Omit<AttendanceRecord, 'id' | 'timestamp'>) {
    const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE), {
      ...attendanceData,
      timestamp: serverTimestamp()
    });
    
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as AttendanceRecord;
  },

  async getForMeeting(meetingId: string) {
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('meetingId', '==', meetingId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as AttendanceRecord[];
  },

  async updateStatus(meetingId: string, userId: string, status: 'present' | 'absent') {
    // First check if record exists
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('meetingId', '==', meetingId),
      where('userId', '==', userId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing record
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { 
        status,
        timestamp: serverTimestamp()
      });
      
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as AttendanceRecord;
    } else {
      // Create new record
      return await this.create({
        meetingId,
        userId,
        status
      });
    }
  },

  async getStats(userId?: string) {
    let q;
    
    if (userId) {
      q = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('userId', '==', userId)
      );
    } else {
      q = query(collection(db, COLLECTIONS.ATTENDANCE));
    }
    
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => doc.data());
    
    const totalMeetings = new Set(records.map(r => r.meetingId)).size;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const averageAttendance = totalMeetings > 0 ? (presentCount / totalMeetings) * 100 : 0;
    
    return {
      totalMeetings,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      presentCount,
      absentCount
    };
  }
};