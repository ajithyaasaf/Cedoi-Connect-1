import { users, meetings, attendanceRecords, type User, type InsertUser, type Meeting, type InsertMeeting, type AttendanceRecord, type InsertAttendance } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Meeting methods
  getMeeting(id: number): Promise<Meeting | undefined>;
  getAllMeetings(): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeetingsByUser(userId: number): Promise<Meeting[]>;
  getTodaysMeeting(): Promise<Meeting | undefined>;

  // Attendance methods
  getAttendanceForMeeting(meetingId: number): Promise<AttendanceRecord[]>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(meetingId: number, userId: number, status: 'present' | 'absent'): Promise<AttendanceRecord>;
  getAttendanceStats(userId?: number): Promise<{
    totalMeetings: number;
    averageAttendance: number;
    presentCount: number;
    absentCount: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private meetings: Map<number, Meeting> = new Map();
  private attendanceRecords: Map<number, AttendanceRecord> = new Map();
  private currentUserId = 1;
  private currentMeetingId = 1;
  private currentAttendanceId = 1;

  constructor() {
    // Initialize with default users
    this.createUser({
      email: "sonai@cedoi.com",
      name: "Sonai",
      role: "sonai",
      qrCode: "sonai_qr_123"
    });
    
    this.createUser({
      email: "chairman@cedoi.com", 
      name: "Chairman",
      role: "chairman",
      qrCode: "chairman_qr_456"
    });

    // Add some sample members
    this.createUser({
      email: "priya@cedoi.com",
      name: "Priya Sharma",
      role: "member",
      qrCode: "priya_qr_789"
    });

    this.createUser({
      email: "rajesh@cedoi.com",
      name: "Rajesh Kumar", 
      role: "member",
      qrCode: "rajesh_qr_101"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      qrCode: insertUser.qrCode || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.currentMeetingId++;
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      venue: insertMeeting.venue || "Mariat Hotel, Madurai",
      agenda: insertMeeting.agenda || null,
      createdBy: insertMeeting.createdBy || 1,
      repeatWeekly: insertMeeting.repeatWeekly || false,
      isActive: insertMeeting.isActive || true,
      createdAt: new Date()
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async getMeetingsByUser(userId: number): Promise<Meeting[]> {
    return Array.from(this.meetings.values())
      .filter(meeting => meeting.createdBy === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTodaysMeeting(): Promise<Meeting | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.meetings.values())
      .find(meeting => {
        const meetingDate = new Date(meeting.date);
        return meetingDate >= today && meetingDate < tomorrow && meeting.isActive;
      });
  }

  async getAttendanceForMeeting(meetingId: number): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(record => record.meetingId === meetingId);
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const id = this.currentAttendanceId++;
    const attendance: AttendanceRecord = {
      ...insertAttendance,
      id,
      meetingId: insertAttendance.meetingId || 1,
      userId: insertAttendance.userId || 1,
      timestamp: new Date()
    };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async updateAttendance(meetingId: number, userId: number, status: 'present' | 'absent'): Promise<AttendanceRecord> {
    // Find existing record
    const existing = Array.from(this.attendanceRecords.values())
      .find(record => record.meetingId === meetingId && record.userId === userId);

    if (existing) {
      existing.status = status;
      existing.timestamp = new Date();
      return existing;
    } else {
      return this.createAttendance({
        meetingId,
        userId,
        status
      });
    }
  }

  async getAttendanceStats(userId?: number): Promise<{
    totalMeetings: number;
    averageAttendance: number;
    presentCount: number;
    absentCount: number;
  }> {
    const meetings = userId ? 
      await this.getMeetingsByUser(userId) : 
      await this.getAllMeetings();
    
    const totalMeetings = meetings.length;
    let presentCount = 0;
    let absentCount = 0;

    for (const meeting of meetings) {
      const attendance = await this.getAttendanceForMeeting(meeting.id);
      presentCount += attendance.filter(a => a.status === 'present').length;
      absentCount += attendance.filter(a => a.status === 'absent').length;
    }

    const totalAttendanceRecords = presentCount + absentCount;
    const averageAttendance = totalAttendanceRecords > 0 ? 
      (presentCount / totalAttendanceRecords) * 100 : 0;

    return {
      totalMeetings,
      averageAttendance: Math.round(averageAttendance),
      presentCount,
      absentCount
    };
  }
}

export const storage = new MemStorage();
